---
tags: linux performance arm benchmark android simpleperf adb aarch64
category: programming
title: "Part 5: My superfast right ARM, the phone"
date: 2026-02-01 15:10:00 +05:30
---

Ahoy there! Welcome to part 5 of this series.

> For those who landed here directly, this is the part 5 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at all the previous posts before reading this.

This is a surprise episode where I abandon my powerful (cough) laptop and run the benchmark on my [Moto Edge 40 Neo](https://www.gsmarena.com/motorola_edge_40_neo-12467.php) phone which has a MediaTek dimnesity 7030 with 12G RAM.


## TL;DR
In this episode
- We explore the CPUs available in my smartphone (ARM A78, A55 clusters)
- Try to figure out why A78 outperforms by i7
- Compare the micro-architectures


## Setup on the phone

To get the binaries set up for running my benchmark, I am using a Android app named [Termux](https://wiki.termux.com/) from playstore and installed below packages. It also allows me [SSH in to the my phone](https://wiki.termux.com/wiki/Remote_Access). `adb shell` (from android platform tools) is also a good option.

- openjdk-25-x
- git
- maven


The results surprised me (for reference the avg thruput in my computer was ~135 ops/s).

```
$ java -jar target/benchmarks.jar -wi 3 -i 2
# JMH version: 1.37
# VM version: JDK 25.0.1, OpenJDK 64-Bit Server VM, 25.0.1
# VM invoker: /data/data/com.termux/files/usr/lib/jvm/java-25-openjdk/bin/java
# VM options: <none>

...

# Run progress: 0.00% complete, ETA 00:01:40
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 212.569 ops/s
# Warmup Iteration   2: 213.783 ops/s
# Warmup Iteration   3: 213.111 ops/s
Iteration   1: 213.660 ops/s
Iteration   2: 213.078 ops/s

...

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    2  216.907          ops/s
```

Surprising right? My phone is executing code better than my laptop. How good are the CPU cores? Let's see the `lscpu` output

```bash
$ lscpu
Architecture:             aarch64
  CPU op-mode(s):         32-bit, 64-bit
  Byte Order:             Little Endian
CPU(s):                   8
  On-line CPU(s) list:    0-7
Vendor ID:                ARM
  Model name:             Cortex-A55
    Model:                0
    Thread(s) per core:   1
    Core(s) per socket:   6
    Socket(s):            1
    Stepping:             r2p0
    CPU(s) scaling MHz:   75%
    CPU max MHz:          2000.0000
    CPU min MHz:          400.0000
    BogoMIPS:             26.00
    Flags:                fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp cpuid asimdrdm lrcpc dcpop asimddp
  Model name:             Cortex-A78
    Model:                0
    Thread(s) per core:   1
    Core(s) per socket:   2
    Socket(s):            1
    Stepping:             r1p0
    CPU(s) scaling MHz:   62%
    CPU max MHz:          2500.0000
    CPU min MHz:          450.0000
    BogoMIPS:             26.00
    Flags:                fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp cpuid asimdrdm lrcpc dcpop asimddp
```

## Two types of processors

- Mobile phones pack two clusters (sometimes [more](https://nanoreview.net/en/soc-list/rating)) of different type of cores. This design is known as big.LITTLE. OS runs tasks on these cores depending on the phone state (active / going to sleep / locked) to minimize power usage and improve the user experience.

- The design of the phone h/w (aka Soc - System on Chip) is also different than laptops. CPU cores, Memory Controller, GPU, NPU, Modem, ISP (Image Signal Processor), DSP (Digital Signal Processor) are all put on a single chip. Even memory is directly soldered over the SoC to minimize the wire distance.


    > If you are interested in researching more, these are some good starting points to pick keywords.
    >  - [Nextpit - SoC, components, market players etc.](https://www.nextpit.com/how-tos/smartphone-socs-explained)
    >  - [Nanoreview - Ratings of SoCs](https://nanoreview.net/en/soc-list/rating)


Still, these processors (the Cortex-A78) have little less cycles/sec compared to my computer (2.6GHz). But they are still able to pull out better performance than it. How is that possible? Lets find out



## Further exploring the device

It seems unless we root the device, we don't have much freedom in Android (we can't fully access `/sys` or `/proc`). Since I have only one phone, I don't plan to do it. But the `adb` gives us a little space to experiment (even access `/sys` and `/proc` fs). To use it, we need to 
  - enable developer options and USB debugging on the phone
  - connect the phone to the computer using USB
  - accept USB debugging the phone.
  - run the command `adb shell` from your computer.

There are a lot of interesting binaries you can find on the phone's `/system/bin`. Luckily I found `simpleperf`, `taskset` (somewhat mimicking the linux counterparts) and `getconf` (gets some config including h/w details) somewhat useful for my experiments. 


## Running the benchmark with the `simpleperf`

We can't run java jars directly in the Android because Android doesn't use hotspot JVM. It uses a runtime named ART ([Android RunTime](https://source.android.com/docs/core/runtime)) which has some optimizations like
  - install time AOT
  - Storage format (Dex)
  - Instruction set (ISA is very similar to H/W unlike Java's stack based ISA)

So, to run my experiments, I have to install JDK in Android. This along with getting `simpleperf` work with my benchmark was a little challenging task as Android has its own security nuances. But I was able to get it working and have documented the steps here - [Profiling JVM applications in Androind with simpleperf]({% post_url 2026-01-26-perf-jvm-on-android %})




## Results

I ran just 1-1 iteration of warmup and benchmark since I was just interested in comparing the executions across my devices.

```bash
$ simpleperf stat java -Djava.io.tmpdir=/tmp -jar benchmarks.jar -wi 1 -i 1
...
Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt       222.373          ops/s
Performance counter statistics:

#            count  event_name                # count / runtime
    84,395,075,038  cpu-cycles                # 2.438765 GHz      
     2,335,225,363  stalled-cycles-frontend   # 67.367 M/sec      
    22,775,548,075  stalled-cycles-backend    # 657.453 M/sec     
   305,289,176,670  instructions              # 8.806 G/sec       
        61,092,620  branch-misses             # 1.764 M/sec       
  42865.714903(ms)  task-clock                # 1.023328 cpus used
             4,629  context-switches          # 107.988 /sec      
            45,690  page-faults               # 1.066 K/sec       

Total test time: 41.888528 seconds.
```

Just for comparison, these are the results from my laptop

```bash
$ perf stat java -jar target/benchmarks.jar -wi 1 -i 1
...
Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt       132.207          ops/s

 Performance counter stats for 'java -jar target/benchmarks.jar -wi 1 -i 1':

         43,384.89 msec task-clock                       #    1.039 CPUs utilized             
             7,487      context-switches                 #  172.572 /sec                      
               316      cpu-migrations                   #    7.284 /sec                      
            51,622      page-faults                      #    1.190 K/sec                     
   305,278,941,912      instructions                     #    2.72  insn per cycle            
   112,416,022,152      cycles                           #    2.591 GHz                       
    29,189,028,043      branches                         #  672.792 M/sec                     
        83,960,921      branch-misses                    #    0.29% of all branches           

      41.772097256 seconds time elapsed

      43.049849000 seconds user
       0.385152000 seconds sys
```

### Comparison
Even though the perfs don't expose similar counters for both devices, there are a few stats we can normalize and pay attention to.

| Counter name  | Phone (2.4GHz)  | Laptop (2.6GHz) |
| --------      | ------          | -------         |
| cycles        | 84,395,075,038  | 112,416,022,152 |
| instructions  | 305,289,176,670 | 305,278,941,912 |
| IPC*          | 3.617           | 2.716           |
| CPI**         | 0.276           | 0.368           |

- \* IPC - Instructions per cycle
- \*\* CPI - Cycles per instruction


Even though theoretically (just looking at CPU frequency) my laptop can execute more instructions per second, my phone is able to surpass it in practice. This is due to two things (well many things, but we will see two for now)


## Latency due to stalls
Even though a processor can execute at very high frequency, the amount of cycles to fetch operands from memory limits its abilities significantly. Caches like L1, L2, L3 help solve this problem to some extent. But if the memory access patterns of the application is random (which is true in languages with garbage collected languages), the memory latencies increase.

> If you want to refresh the knowledge on caches here is a primer - [Caching and Performance of CPUs](https://blog.jyotiprakash.org/caching-and-performance-of-cpus#heading-2-set-associative-cache)


Let's look at the caches at both these devices

|     | Cortex-A55                   | Cortex-A78                                   | i7-9750                                |
| --- | ---------------------------- | -------------------------------------------- | -------------------------------------- |
| L1i | private<br>64KB<br>4 way<br> | private<br>64KB<br>4 way<br>4 cycles<br>VIPT | private<br>32KB<br>4 way<br>4-5 cycles |
| L1d | same as above                | same as above                                | same as above                          |
| L2  | private<br>256KB             | private<br>512KB<br>9 cycles                 | private<br>256KB<br>12-14 cycles       |
| L3  | shared<br>4MB                | shared<br>4MB<br>26-31 cycles                | shared<br>12MB<br>40-60+ cycles        |

Cortex-A78 uses a technique named VIPT which makes the Virtual address **->** Physical address and Physical address **->** cache lookup parallel. Although this seems cool, it has disadvantages which you will see in next episode.

### References
- Intel - [uops](https://www.uops.info/cache.html#:~:text=Skylake%20L3%20policy-,Core%20i7%2D8700K%20(Coffee%20Lake),-L1%20data%20cache)
- ARM - 
  - A78 - [wikichip](https://en.wikichip.org/wiki/arm_holdings/microarchitectures/cortex-a78)
  - A55 - [wikipedia](https://en.wikipedia.org/wiki/List_of_ARM_processors), [arm blog](https://developer.arm.com/community/arm-community-blogs/b/architectures-and-processors-blog/posts/arm-cortex-a55-efficient-performance-from-edge-to-cloud)

### Conclusion
Cortex-A78 wins the cache race (for now 🙃)


## Micro-architecture

If you have taken a computer organization course you might already know about concepts like Pipelining, Superscalar execution and Out of order execution. If not you can read these below awesome books. (Luckily, 6th edition of the first book covers the Intel i7)

- [**Computer Organization and Design**](https://amzn.in/d/eZhWHSY) - Patterson and Hennessy
- [**Computer Architecture - A quantitative approach**](https://amzn.in/d/45m9ThI) - Patterson and Hennessy


For people who need a refresher, here are the briefs -

### Pipelining
Every instruction processor executes can be broken down into multiple uOps (micro operations). Each uOp can be run by a specific modules inside the processor and processors have multiple such modules. Eg. A `load from immediate memory to a register` instruction can be broken in to 

- Load instruction
- Decode instruction
- Fetch from memory
- Write to register

Every uOp can be run in one clock cycle. Processors these days run the uOps from different instructions in parallel. The depth of the pipeline is decided by number of uOps a instruction can be broken down in to (some processors have fixed depth (ARM), some have varying depth).

In an ideal scenario, the pipeline of depth X gives X fold improvement in performance. But in practice there are dependencies and limitations called as **Hazards** causing **pipeline stalls** which limits the IPC to less than ideal.


### Superscalar execution
Processors have duplicated modules to handle similar uOps.

### Out of order execution
Processors run the instructions in a order different than program order. This reduces the number of pipeline stalls. In some systems compilers and processors work together to achieve this goal.

### Branch prediction
Instructions fed to processor are not linear (one after the other) because of branch instructions. These cause **branch** hazards. Processors don't wait till they get the result of the condition evaluation, instead they try to predict the branch direction and continue with pipelining the instructions. When the direction taken is incorrect, the results of the branch are flushed away.

### Few terms
* **Front-end** : The part of the processor which fetches, decodes and keeps the instructions ready for execution.
* **Back-end** : The part of the processor which executes the instruction and commits the results.

### Comparison of Cortex-A78 and i7-9750

|     | Cortex A55 | Cortex A78 | Intel i7 9750H |
| --- | ---------- | ---------- | -------------- |
| **Pipeline depth** | 8 stage | 13 stage | 14-19 stages |
| **Multiple issue** | No | Yes | Yes |
| **OoO support**    | No | Yes | Yes |
| **Front end**      | 2 issue | 6 way predecode feeding<br>4 way decode | 3+1 decoder (1 complex decoder)<br>uOps go in to a cache (1536 entries)<br>4 decoders producing at max 6 uOps |
| **Backend**        | 2 issue | 10 issue backend | 4 issue backend |
| **Reorder buffer** | NA | ~160 instruction support | 224 slots|
| **int ALUs**       | 2 ALUs | 6 ALU pipelines (3 basic) | 4 ALU pipelines |
| **float ALUs**     | 2 ALUs | 2 ALU pipelines | 2 (256 bit wide) |


### Some notes
- Depth of i7 pipeline is quite high, it might look more parallel, but any missed branch prediction can cause the results of the pipeline to be flushed.
- Cortex A78 has a little wider pipeline (2 extra ALUs)
- Cortex A78 has bigger L1 cache which can reduce stalls.

### Conclusion
Even with lower clock rate the ARM's A78 cluster outperformed the desktop i7-9750 in this particular benchmark because of its architectural design.


### Work in progress
Right now, we just have a reason for why things are working fast on my phone, but we don't know whether that is the limit. We can try formulating a rough speedup phone has on this benchmark because of the design advantages. I will try to complete it soon and publish it in upcoming episodes.


## Challenge for you

While running the benchmark on my phone, once I recorded the below awful numbers. What do you think is the cause?

```
$ simpleperf stat java -Djava.io.tmpdir=/tmp -jar benchmarks.jar -wi 1 -i 1
...
Benchmark                      Mode  Cnt   Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt       29.836          ops/s
Performance counter statistics:

#            count  event_name                # count / runtime
    94,683,803,685  cpu-cycles                # 1.985316 GHz      
     4,083,967,406  stalled-cycles-frontend   # 85.632 M/sec      
    55,192,344,286  stalled-cycles-backend    # 1.157 G/sec       
    57,893,611,523  instructions              # 1.214 G/sec       
       107,917,057  branch-misses             # 2.263 M/sec       
  47673.627973(ms)  task-clock                # 1.061123 cpus used
             4,803  context-switches          # 100.748 /sec      
            46,413  page-faults               # 973.557 /sec
```


<details class="collapsable" markdown="1">
<summary>Answer</summary>
<div markdown="1">
Apparently, my phone was locked and due to that the task was scheduled on cores 0-5 (which are Cortex-A55) which are optimized for powersave mode. 

To verify this I ran it on performance core (192 is mask for processor 6,7. 192 = 11000000 in binary)
```bash
$ taskset 192 java -Djava.io.tmpdir=/tmp -jar benchmarks.jar
...
# Warmup Iteration   1: 198.336 ops/s
```

ran it again on powersave core
```bash
$ taskset 3 java -Djava.io.tmpdir=/tmp -jar benchmarks.jar
...
# Warmup Iteration   1: 29.135 ops/s
```

Now if you scroll up to see the specs of these cores A55 does a in-order execution with 2 width issue. Its clock is also 2000MHz max. You can see all these factors screaming in the numbers below. Notice the

- instructions/sec
- branch-misses
- stalled-cycle-backend

```bash
$ taskset 3 simpleperf stat java -Djava.io.tmpdir=/tmp -jar benchmarks.jar -wi 0 -i 1
...
Benchmark                      Mode  Cnt   Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt       28.654          ops/s

Performance counter statistics:

#            count  event_name                # count / runtime
    53,948,402,972  cpu-cycles                # 1.988907 GHz      
     3,915,081,046  stalled-cycles-frontend   # 144.337 M/sec     
    30,928,617,894  stalled-cycles-backend    # 1.140 G/sec       
    30,365,725,171  instructions              # 1.119 G/sec       
       105,023,210  branch-misses             # 3.872 M/sec       
  27125.278444(ms)  task-clock                # 1.100211 cpus used
             5,510  context-switches          # 203.132 /sec      
            45,421  page-faults               # 1.674 K/sec       

Total test time: 24.654622 seconds.
```

</div>
</details>

**That's all for this episode.  In upcoming episodes, we will explore the possibilities of improving the performance in both devices. Matane!**