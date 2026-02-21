---
tags: linux performance benchmark tlb cache memory
category: programming
title: "Part 6: Memory (TLB)"
date: 2026-02-01 15:10:00 +05:30
---

Hello! Welcome to part 6 of this series. In this episode we will try to quantify the latencies involved in the memory accesses and try to reduce them.

> For those who landed here directly, this is the part 6 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at all the previous posts before reading this.


For my initial years in the world of computers, I had been very ignorant of overhead by the memory system and hadn't bothered much to read about it. Later I realized that memory is a significant bottleneck for applications who crunch huge amounts data. Let's first understand why theoretically.


## Memory

There are different types of memory modules available (SRAM, DRAM) which vary in throughput and internal design. The high throughput ones eat up more power / money. So system designers organize these memory modules in a hierarchy where smallest and fastest memory is near the CPU. Usually hierarchy is -

- L1 cache (smallest, fastest, near to processor, private, SRAM)
- L2 cache (private to processor, SRAM)
- L3 cache (largest and slowest cache, shared among processors, SRAM)
- Main memory (slowest, shared, DRAM, far away from processors)

Accesses of memory are tried in this order - L1, L2, L3 and main memory. Every miss in the cache (L1, L2, L3) causes processor backend stalls and backend might be totally idle in those cycles (hyperthreads try solve this).

Here are the number of cycles needed to access a word in my i7-9750 processor

| Memory      | Cycles for read    |
| ----------- | ------------------ |
| L1i         | 4-5 cycles         |
| L1d         | same as above      |
| L2          | 12-14 cycles       |
| L3          | 40-60+ cycles      |
| Main memory | 100+ cycles        |


## Overheads / latencies in memory access

### Design overhead
The CPU is connected to main memory thru a memory controller and a bus (In Intel processors its now Ultra path interconnect (UPI)). Even though the UPI is point to point channel between CPU and memory & peripherals, requests from multiple processors can saturate the address and data lines and these lines become a bottleneck. To increase the throughput of memory, designers came up with ideas like 
  - Doubling the data rate by moving data in both edges of the clock cycle (DDR)
  - buffering in the memory module (speed) eg. DDR1, DDR2, DDR3 ...
  - increasing the bus width (bandwidth)


### Virtual memory (VM) overhead
Intel introduced virtual memory in 1985 in its `i386` microprocessor for effcient memory management and (by adding h/w support to fight fragmentation). I am not going in to the details of the VM here but I suggest you recall these concepts before reading further. Here is a section which may help you recall VM


<details class="collapsable" markdown="1">
<summary>A small section on virtual memory</summary>
<div markdown="1">
CPUs with VM support use addresses known as virtual addresses for accessing the memory which are converted to physical memory addresses (actual addresses the memory chip understands). This is done with h/w support. OS sets up page tables (data structures helping the hardware in this conversion) which helps in stitching the address space of a process using pages (small memory chunks) scattered in the actual memory & blocks in the disks.


The virtual to physical address conversion happens as follows

  1. Split the address in to two major parts.
      - Page index
      - Offset

  2. Find the physical frame base address identified by the page index. This involves 
      - loading the page table entry (again from memory)
      - if system uses multi level page tables (as in Linux), traverse the page table heirarchy to load it

  3. Add the offset to the frame base address and use it for access (cache, main memory both work with physical addresses)
</div>
</details>

#### TLB
If naively implemented, every address conversion will cost a lot of cycles because page tables also live in memory. In systems like Linux which use 4-5 level page tables this will make things terribly slow. To make page index -> frame index conversion faster, CPUs have a small cache called TLB (Translation lookaside buffer).

#### VIPT
Remember the last episode in which I mentioned that Cortex A78 (my phone's processor) employs VIPT for L1 cache? This technolgy reduces L1 cache access time by starting the TLB lookup and L1 cache lookup parallely. The cache index is derived from few bits of offset and once the results from TLB is available, the bits of results are used to validate whether the looked up any of the cache entry (in a 4 way cache like mine) is correct.

#### Page faults
When there is no valid entry for a page index in the page table, CPU raises an interrupt (GP) and OS handles this interrupt and takes care of setting up / allocating that page (Linux doesn't allocate frames immediately on `brk` or `mmap` syscall). This page fault handling costs a lot of cycles and is bad for latency sensitive applications. There are two types of faults depending on whether disk was accessed or not. **Major page faults** which involve reading / writing a disk block and **minor page faults** just need some page table adjustment.

##### Mapped file page faults
Loader in Linux (used by `execve`) `mmap`s the executable's file for the process. When a file is mmap'ed the contents of the file are not immediately read to the memory from disk. The disk read happens due to the page fault which occurs when program tries to access the mapped memory which is not yet loaded. Even Java `mmap`'s the jar file and class files.


## Measuring the overhead

Let's measure these overheads in our benchmark using `perf`. 

```bash
$ sudo \
taskset -c 10-11 \
  perf stat \
    -e block:block_rq_complete \
    -e dTLB-load-misses,iTLB-load-misses \
    -e L1-dcache-load-misses,L1-icache-load-misses \
    -e LLC-load-misses \
    -e minor-faults,major-faults \
    /home/mpataki/projects/jdk24u/build/linux-x86_64-server-release/jdk/bin/java \
      -Xms2G -Xmx2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar \
        -wi 2 -i 2
...
Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    2  142.007          ops/s

 Performance counter stats for '.../jdk/bin/java -Xms2G -Xmx2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar -wi 2 -i 2':

                 2      block:block_rq_complete
        17,113,519      dTLB-load-misses                                    (80.00%)
         4,985,923      iTLB-load-misses                                    (80.00%)
    27,208,655,619      L1-dcache-load-misses                               (79.99%)
       329,380,156      L1-icache-load-misses                               (80.00%)
         5,912,685      LLC-load-misses                                     (80.01%)
         1,652,540      minor-faults
                 0      major-faults

      84.600379397 seconds time elapsed

      83.920290000 seconds user
       3.892038000 seconds sys
```

Since our Java application needs a large working set (JVM, JDK & JMH classes, Heap, Generated code) the TLB misses are common (17M dTLB and 5M iTLB accounting for 80% TLB misses). Interestingly there is no major fault and just 2 disk block-reads (may be new files), thanks to Linux caches (which cache part of files read, directory entries, inodes read from disk). In practise we can warm up the cache or keep the executables in a `ramfs` which always keeps the content in memory / use `mlockall` to lock the memory of the process. Anyway, we are good for now, so let's look at other metrics.

Also, if you are interested in knowing how many major faults can occurr if there is no page cache, expand and check this below section

<details class="collapsable" markdown="1">
<summary>Inducing major faults</summary>
<div markdown="1">
We can clear up the Linux caches (and wait for some time) and notice the major faults. Here is how it can be done

1. Sync the pages to disk which needs a sync (duh!)

    ```bash
    $ sudo sync
    ```

2. Drop Page, Dentries & Inode cache

    ```bash
    $ echo 3 | sudo tee /proc/sys/vm/drop_caches
    ```

After the caches are dropped, and the disk activity to subsides (monitoring using `iostat`), run of my benchmark

```bash
Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    2  142.091          ops/s

 Performance counter stats for '.../jdk/bin/java -Xms2G -Xmx2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar -wi 2 -i 2':

               190      block:block_rq_complete                                               
        17,380,074      dTLB-load-misses                                    (80.01%)
         5,253,573      iTLB-load-misses                                    (80.00%)
    26,765,318,470      L1-dcache-load-misses                               (80.02%)
       346,571,098      L1-icache-load-misses                               (79.99%)
         5,854,761      LLC-load-misses                                     (79.98%)
         1,651,016      minor-faults                                                          
               146      major-faults                                                          

      85.154327506 seconds time elapsed

      83.985327000 seconds user
       4.030767000 seconds sys
```

</div>
</details>


## TLB misses
In Linux the page size is by default 4KB (can be checked by `getconf PAGE_SIZE`) so if the application's code/data footprint is huge and it accesses many such small pages frequently, the TLB cache is gonna miss often (80% of the time in above run). We can increase the page size to solve this and fortunately, Linux allows us to use preconfigured huge pages.

There are two Linux APIs

1. `mmap` with MAP_HUGETLB and a page size flags (MAP_HUGE_2MB, MAP_HUGE_1GB)
2. `madvise` on a page aligned pointer and size; suggesting kernel to make this page a huge page (aka Transparent Huge Pages (THP)). Kernel scans the pages regularly and changes this page to a huge one, if possible.

Except the THP (which seems to be default in the recent kernels), huge pages feature should be configured by sys admin and explictly used by the application. Java supports this since SE 5.0 with below JVM flags

```
-XX:+UseLargePages            # enable usage of huge pages
-XX:LargePageSizeInBytes=2M   # set the huge page size (huge page sizes should be either of 2MB or 1GB)
-XX:+UseTransparentHugePages  # enable THP
```

Let's try this feature and measure again. To use the full huge page support, we need to configure the kernel boot params so it allocates the huge pages in the startup when there is no physical memory fragmentation yet. Since I have not configured it yet, let's use THP and test it.

```bash
$ sudo \
taskset -c 10-11 \
  perf stat \
    -e dTLB-load-misses,iTLB-load-misses \
    /home/mpataki/projects/jdk24u/build/linux-x86_64-server-release/jdk/bin/java \
      -XX:+UseLargePages -XX:+UseTransparentHugePages -XX:LargePageSizeInBytes=2M \
      -Xms2G -Xmx2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar \
        -wi 2 -i 2
...
# Run progress: 0.00% complete, ETA 00:01:20
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 178.809 ops/s
# Warmup Iteration   2: 177.107 ops/s
Iteration   1: 182.021 ops/s
Iteration   2: 175.457 ops/s

# Run progress: 50.00% complete, ETA 00:00:40
# Fork: 1 of 1
# Warmup Iteration   1: 174.125 ops/s
# Warmup Iteration   2: 170.016 ops/s
Iteration   1: 173.280 ops/s
Iteration   2: 171.078 ops/s

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    2  172.179          ops/s

 Performance counter stats for '.../jdk/bin/java -XX:+UseLargePages -XX:+UseTransparentHugePages -XX:LargePageSizeInBytes=2M -Xms2G -Xmx2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar -wi 2 -i 2':

         2,211,198      dTLB-load-misses
         1,763,223      iTLB-load-misses
```

Wow! the results are really good! Notice the dTLB misses went down 

| misses  | without THP | with THP |
| ------- | ----------- | -------- |
| iTLB    | 5M          | 1.7M     |
| dTLB    | 17M         | 2M       |


What happens when I configure the huge pages? Read about my failed experiment below

<details class="collapsable" markdown="1">
<summary>My failed experiment with manually configured huge pages</summary>
<div markdown="1">

<h3 style="margin: 15px 0px">Configuring huge pages</h3>

[Linux kernel documentation](https://docs.kernel.org/admin-guide/mm/hugetlbpage.html) tells us we need to setup the below boot flags for enabling the huge page pool. I have 16GB of RAM so I want to setup 4GB for huge pages. I will pick 2MB pages as 1GB sounds too huge for my system.

#### Boot flags for huge page support
```
hugepagesz=2M
hugepages=2048 (4GB / 2MB = 2^32 / 2^21 = 2048)
default_hugepagesz=2M
```

I'll have to append these flags to `GRUB_CMDLINE_LINUX_DEFAULT` in `/etc/default/grub`, run `sudo update-grub` and reboot. My current boot cmdline looks like

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash isolcpus=4-5 irqaffinity=6-11 rcu_nocbs=4-5 hugepagesz=2M default_hugepagesz=2M hugepages=2048"
```

Results of my experiment (I even tried 1G huge pages)

| Huge page count, size  | Benchmark throughput | Comment |
| ---------------------- | -------------------- | ------- |
| 2048, 2MB              | ~140 ops/sec         | didn't change much |
| 10, 1G                 | ~182 ops/sec         | huge improvement, but I still saw a error <br/> `OpenJDK 64-Bit Server VM warning: Failed to reserve and commit memory using large pages. req_addr: 0x0000000000000000 bytes: 251658240` |

</div>
</details>


## An excercise
The above explanation for VIPT is not complete, for a system with 64KB, 4 way set associative cache, 4KB page size the simple VIPT explained above won't work. Try to jot down the concepts & diagrams of Paging and Cache lookups and try to fit the idea of VIPT in to it and see it break. Later read [this](https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/page-colouring-on-armv6-and-a-bit-on-armv7) article from ARM (or get Chat to help you) and learn the `page coloring` restriction. I promise you, it's fun!


<br/><br/>

**That's all for this episode. In the next episode we will try to reduce the stalls due to memory further down by doing some application changes.**

**For now I'll leave you with few research pointers if you want to explore further.**

### Future research
- Find out whether we can further reduce the iTLB cache misses (something like by putting JVM, code cache in a single huge 1G page)


**<center>Until then bye bye!</center>**
