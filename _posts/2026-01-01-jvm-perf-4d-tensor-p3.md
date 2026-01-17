---
tags: java jvm performance benchmark linux
category: programming
title: "Part 3: CPU isolation, IRQs and memory-mgmt"
date: 2026-01-01 23:00:00 +05:30
---

Hey hey hey! Welcome to 2026 and... part 3 of this series.

> For those who landed here directly, this is the part 3 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at all the previous posts before reading this.

<br>

Code and results referred here are present in [mmpataki/tensor.benchmark](https://github.com/mmpataki/tensor.benchmark), you can get them and reproduce the results on your computer by -

```bash
# clone the repo, cd & pull
$ git clone https://github.com/mmpataki/tensor.benchmark; cd tensor.benchmark; git pull

# checkout the branch used for this part
$ git checkout p3-cpuisolation-irqs-memorymgmt

# build the benchmark
$ mvn clean package
``` 
<br>

In the last part of this series, we found out that there is a jitter in our system due to which the results of our benchmarks were inconsistent. We tried solving it by pinning our process to few processors using the `taskset` but Linux still scheduled other tasks on these processors. We need to solve this problem if we want good and real results of our activity. So how do we tell Linux to not use some processors for scheduling.

After some googling (Gemini) I found out that there is a way in Linux to isolate the processors completely. No general purpose scheduling happens on those CPUs. We do this by setting a cmdline argument `isolcpus` for the kernel. Post this we need to run our process with processor affinity. Let's try that out.

### `isolcpus` (isolated CPUs)

To use this feature, I edited the file `/etc/default/grub` and added the below option. `isolcpus=5-11`  (as super user)

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash isolcpus=2-6"
```

And run below command
```bash
update-grub
```

... And reboot the laptop.

To verify whether the changes are in effect, we can

```bash
$ cat /sys/devices/system/cpu/isolated 
6-11
```

Let's see the stats as well.

```
$ mpstat -P ALL 
Linux 6.14.0-37-generic (kurukshetra) 	12/31/2025 	_x86_64_	(12 CPU)

11:10:03 PM  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest  %gnice   %idle
11:10:03 PM  all    9.04    0.02    5.18    1.04    0.00    0.02    0.00    0.00    0.00   84.70
11:10:03 PM    0   17.36    0.04    9.66    2.57    0.00    0.19    0.00    0.00    0.00   70.18
11:10:03 PM    1   18.75    0.00   11.53    2.07    0.00    0.00    0.00    0.00    0.00   67.66
11:10:03 PM    2   17.45    0.06   10.44    1.85    0.00    0.06    0.00    0.00    0.00   70.15
11:10:03 PM    3   18.75    0.02   10.81    2.38    0.00    0.00    0.00    0.00    0.00   68.04
11:10:03 PM    4   18.54    0.06   10.52    1.64    0.00    0.00    0.00    0.00    0.00   69.24
11:10:03 PM    5   18.10    0.08    9.48    1.99    0.00    0.00    0.00    0.00    0.00   70.36
11:10:03 PM    6    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
11:10:03 PM    7    0.00    0.00    0.02    0.00    0.00    0.00    0.00    0.00    0.00   99.98
11:10:03 PM    8    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
11:10:03 PM    9    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
11:10:03 PM   10    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
11:10:03 PM   11    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
```

You see... it's still not quiet on proc-7. What can it be? Let's figure out. I will run `perf` for monitoring task migration events and do some random use of my laptop.

```bash
$ sudo perf record -e sched:sched_switch,sched:sched_migrate_task
```

Post this, I loaded ~50 tabs on my browser and again checked the `mpstat` output to see whether there was some activity on processor 6-11.
```
$ mpstat -P ALL
Linux 6.14.0-37-generic (kurukshetra) 	12/31/2025 	_x86_64_	(12 CPU)

11:34:16 PM  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest  %gnice   %idle
...
11:34:16 PM    5    4.92    0.03    1.54    0.20    0.00    0.00    0.00    0.00    0.00   93.31
11:34:16 PM    6    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
11:34:16 PM    7    0.00    0.00    0.01    0.00    0.00    0.00    0.00    0.00    0.00   99.99
11:34:16 PM    8    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00  100.00
...
```

So there is some `%sys` activity on proc-7. I stopped the perf and listed the tasks migrated to proc-7. (My perf output is at [`perf_cs_migs/perf.data`](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p3-cpuisolation-irqs-memorymgmt/perf_cs_migs/perf.data))
```
$ sudo perf script | grep dest_cpu=7
     migration/6      56 [006]  1438.155439: sched:sched_migrate_task: comm=perf pid=13092 prio=120 orig_cpu=6 dest_cpu=7
```

Notice the `comm=perf` This shows us that when perf process was running, it did something in kernel mode. But what? We need detailed stats here. So I repeated the activity looking for all events. This time it was again proc-7 (0.02%).

```
$ perf script | grep '\[007\]' | awk '{print $1}' | sort | uniq
ksoftirqd/7
kworker/7:1-eve
kworker/7:1H-kb
migration/7
swapper
```

So some activity like swapping, irq handling, kernel worker threads are running on proc-7. We can put `-g` on perf and we will get the stack trace as well. One interesting stack trace I got is (the file for this is at [`perf_stacks/perf.data`](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p3-cpuisolation-irqs-memorymgmt/perf_stacks/perf.data))

```
swapper       0 [007]  2643.825563:     274923 cycles:P: 
        ffffffff8c3defac select_task_rq+0x4c ([kernel.kallsyms])
        ffffffff8c3e5953 try_to_wake_up+0x153 ([kernel.kallsyms])
        ffffffff8c3e5f65 wake_up_process+0x15 ([kernel.kallsyms])
        ffffffff8c3b056c kick_pool+0x8c ([kernel.kallsyms])
        ffffffff8c3b4d61 __queue_work+0x281 ([kernel.kallsyms])
        ffffffff8c3b4f77 queue_work_on+0x77 ([kernel.kallsyms])
        ffffffff8cdf72a1 schedule_console_callback+0x21 ([kernel.kallsyms])
        ffffffff8cdef979 kbd_event+0xb9 ([kernel.kallsyms])
        ffffffff8d0ce143 input_handle_events_default+0x43 ([kernel.kallsyms])
        ffffffff8d0ce43a input_pass_values+0x13a ([kernel.kallsyms])
        ffffffff8d0ce5d7 input_event_dispose+0x167 ([kernel.kallsyms])
        ffffffff8d0d29e1 input_handle_event+0x41 ([kernel.kallsyms])
        ffffffff8d0d2a81 input_event+0x51 ([kernel.kallsyms])
        ffffffffc059be08 hidinput_report_event+0x38 ([kernel.kallsyms])
        ffffffffc0598d86 hid_report_raw_event+0xb6 ([kernel.kallsyms])
        ffffffffc0599027 __hid_input_report+0x157 ([kernel.kallsyms])
        ffffffffc0599115 hid_input_report+0x15 ([kernel.kallsyms])
        ffffffffc066587b logi_dj_recv_forward_report.isra.0+0x1b ([kernel.kallsyms])
        ffffffffc0666737 logi_dj_recv_forward_input_report+0x137 ([kernel.kallsyms])
        ffffffffc066735f logi_dj_raw_event+0x1cf ([kernel.kallsyms])
        ffffffffc0599008 __hid_input_report+0x138 ([kernel.kallsyms])
        ffffffffc0599115 hid_input_report+0x15 ([kernel.kallsyms])
        ffffffffc07759b8 hid_irq_in+0x228 ([kernel.kallsyms])
        ffffffff8d042829 __usb_hcd_giveback_urb+0xa9 ([kernel.kallsyms])
        ffffffff8d042aa8 usb_giveback_urb_bh+0xa8 ([kernel.kallsyms])
        ffffffff8c3b3c88 process_one_work+0x178 ([kernel.kallsyms])
        ffffffff8c3b5fd4 bh_worker+0x244 ([kernel.kallsyms])
        ffffffff8c3b63db workqueue_softirq_action+0x7b ([kernel.kallsyms])
        ffffffff8c3914d3 tasklet_hi_action+0x13 ([kernel.kallsyms])
        ffffffff8c390a24 handle_softirqs+0xe4 ([kernel.kallsyms])
        ffffffff8c390d9e __irq_exit_rcu+0x10e ([kernel.kallsyms])
        ffffffff8c39118e irq_exit_rcu+0xe ([kernel.kallsyms])
        ffffffff8d4df8c6 common_interrupt+0xb6 ([kernel.kallsyms])
        ffffffff8c000e67 asm_common_interrupt+0x27 ([kernel.kallsyms])
        ffffffff8d4e466a cpuidle_enter_state+0xda ([kernel.kallsyms])
        ffffffff8d17445e cpuidle_enter+0x2e ([kernel.kallsyms])
        ffffffff8c4032a2 call_cpuidle+0x22 ([kernel.kallsyms])
        ffffffff8c4108d9 cpuidle_idle_call+0x119 ([kernel.kallsyms])
        ffffffff8c4109df do_idle+0x7f ([kernel.kallsyms])
        ffffffff8c410c59 cpu_startup_entry+0x29 ([kernel.kallsyms])
        ffffffff8c32dd79 start_secondary+0x129 ([kernel.kallsyms])
        ffffffff8c2d32ad common_startup_64+0x13e ([kernel.kallsyms])
```

This one seems to be a interrupt handler for a device interrupt (that too a logitech usb device - which is my mouse & keyboard dongle). We can verify that

```
$ cat /proc/kallsyms | grep logi_dj_raw_event
0000000000000000 t logi_dj_raw_event	[hid_logitech_dj]
0000000000000000 t __pfx_logi_dj_raw_event	[hid_logitech_dj]


$ modinfo hid_logitech_dj
filename:       /lib/modules/6.14.0-37-generic/kernel/drivers/hid/hid-logitech-dj.ko.zst
...
author:         Logitech
license:        GPL
description:    HID driver for Logitech receivers
srcversion:     3C7B048E128D631DC68BC64
alias:          hid:b0003g*v0000046Dp0000C71F
```
<br>

So it's IRQs which are ending up on my reserved processors. Are there any other interrupts on 6-11? `/proc/interrupts` will give us that info. It seems there are a lot of interrupts (I have limited the output for brevity - [full text](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p3-cpuisolation-irqs-memorymgmt/interrupts.txt))

```
$ uptime  # this was captured after running below command
 00:09:13 up 59 min,  1 user,  load average: 0.55, 0.89, 1.13

$ cat /proc/interrupts 
            CPU6       CPU7       CPU8       CPU9       CPU10      CPU11      
  17:          0          0       7720          0          0          0 IR-IO-APIC   17-fasteoi   idma64.1, i2c_designware.1, snd_hda_intel:card1
  83:          0          0          0          0         62          0 IR-IO-APIC   83-fasteoi   SYNA2B52:00
 126:          0      33297          0          0          0          0 IR-PCI-MSI-0000:00:14.0    0-edge      xhci_hcd
 137:      57333          0          0          0          0          0 IR-PCI-MSIX-0000:06:00.0    1-edge      nvme0q1
 138:          0      58097          0          0          0          0 IR-PCI-MSIX-0000:06:00.0    2-edge      nvme0q2
 139:          0          0      53458          0          0          0 IR-PCI-MSIX-0000:06:00.0    3-edge      nvme0q3
 140:          0          0          0      58243          0          0 IR-PCI-MSIX-0000:06:00.0    4-edge      nvme0q4
 NMI:       8351      39990      10028       9363        470        449   Non-maskable interrupts
 LOC:       6354      39396       6895       6347       2833       2866   Local timer interrupts
 PMI:       8351      39990      10028       9363        470        449   Performance monitoring interrupts
 IWI:          1         35          3          2          0          2   IRQ work interrupts
 RES:          3          8          2          1          0          6   Rescheduling interrupts
 CAL:      16756      16766      16773      16773      16756      16747   Function call interrupts
 TLB:         36         36         36         36         36         37   TLB shootdowns
 MCP:         11         11         11         11         11         11   Machine check polls
```

<br>

## What are these and how to move them out?
- PMI - Performance monitoring interrupts are may be from `perf`, they can be reduced by not using `perf`.
- nvme* are related to my SSD and SSD driver distributes these interrupts uniformly among processors (we can see that). 
- TLB, CAL - ones are interrupts sent to processors to invalidate their TLB cache, there is very less we can do about these.
- LOC - are local timer interrupts every processor gets periodically.


### How do we move them out? (from the help of chat)
- PMI - not use `perf` while benchmarking.
- LOC - Ask kernel to mask this interrupt on these processors. This can be done by a kernel boot parameter named `nohz_full`
- TLB, CAL - Can't do much, we can may be remove swapping, minimize page faults, keep less processes on the system.
- Other interrupt handling can be moved to other processors by boot flag `irqaffinity`

**Changes I did to `/etc/default/grub`**
```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash isolcpus=6-11 nohz_full=6-11 irqaffinity=0-5"
```

<br>

**one restart later...**

<br>

**THAT DIDNT HELP!!** some interrupts are still delivered to proc 6-11.
```
$ cat /proc/interrupts 
             CPU6       CPU7       CPU8       CPU9       CPU10      CPU11      
 137:       12636          0          0          0          0          0 IR-PCI-MSIX-0000:06:00.0    1-edge      nvme0q1
 138:           0      10491          0          0          0          0 IR-PCI-MSIX-0000:06:00.0    2-edge      nvme0q2
 139:           0          0      10276          0          0          0 IR-PCI-MSIX-0000:06:00.0    3-edge      nvme0q3
 140:           0          0          0       9072          0          0 IR-PCI-MSIX-0000:06:00.0    4-edge      nvme0q4
 LOC:         843        841        879        780        450        455   Local timer interrupts
 IWI:         712        621        626        548          4          7   IRQ work interrupts
 RES:           5          3          3          1          7          6   Rescheduling interrupts
 CAL:       16635      16620      16630      16639      16626      16634   Function call interrupts
 MCP:           4          4          4          4          4          4   Machine check polls
```

### Chat suggested me this

For RCU (it showed up as one of the stack, read about it, it's interesting) interrupts
```
rcu_nocbs=6-11 
```

For NVME interrupts, move them manually before benchmark (3f is a mask for 0-5 processors)
```
echo 3f > /proc/irq/137/smp_affinity
echo 3f > /proc/irq/138/smp_affinity
echo 3f > /proc/irq/139/smp_affinity
echo 3f > /proc/irq/140/smp_affinity
```

LOC will decrease once you pin and run a task.


**That worked!** except NVME interrupts, counts of other interrupts are almost constant / 0 on the processors 6-11 after this. (TODO: for NVME interrupts I still need to research, I noticed they were almost zero on proc 10 & 11 so I am going to use them)

> **PS:** I didn't use them (proc 10-11) in my next few tests and I am too lazy to do them again. Sorry, but you need to read the full article to undestand it would have made no much difference.

## Let's run the benchmark now.

```
$ taskset -c 6-11 java -jar target/benchmarks.jar 
# Run progress: 0.00% complete, ETA 00:03:20
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 135.594 ops/s
# Warmup Iteration   2: 135.201 ops/s
# Warmup Iteration   3: 136.252 ops/s
# Warmup Iteration   4: 135.046 ops/s
# Warmup Iteration   5: 135.203 ops/s
Iteration   1: 135.154 ops/s
Iteration   2: 135.425 ops/s
Iteration   3: 133.876 ops/s
Iteration   4: 134.663 ops/s
Iteration   5: 134.760 ops/s

# Run progress: 50.00% complete, ETA 00:01:41
# Fork: 1 of 1
# Warmup Iteration   1: 137.480 ops/s
# Warmup Iteration   2: 137.724 ops/s
# Warmup Iteration   3: 138.362 ops/s
# Warmup Iteration   4: 136.181 ops/s
# Warmup Iteration   5: 137.182 ops/s
Iteration   1: 137.663 ops/s
Iteration   2: 137.501 ops/s
Iteration   3: 137.599 ops/s
Iteration   4: 136.920 ops/s
Iteration   5: 137.226 ops/s


Result "com.mpataki.Tensor4DBenchmark.accessTest":
  137.382 ±(99.9%) 1.184 ops/s [Average]
  (min, avg, max) = (136.920, 137.382, 137.663), stdev = 0.308
  CI (99.9%): [136.197, 138.566] (assumes normal distribution)

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    5  137.382 ± 1.184  ops/s
```
Here are results from 3 runs (full results [here](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p3-cpuisolation-irqs-memorymgmt/benchmark-1.txt)).
```
(min, avg, max) = (128.384, 128.490, 128.629), stdev = 0.099
(min, avg, max) = (132.413, 132.506, 132.582), stdev = 0.065
(min, avg, max) = (136.335, 136.547, 136.768), stdev = 0.158
```

The numbers are stable now (stdev). But notice the difference in ops/s? We need to investigate that, let's see whether `perf stats` can help here ([full output](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p3-cpuisolation-irqs-memorymgmt/benchmark-with-perf-stats.txt)).

```
$ taskset -c 6-7 perf stat java -jar target/benchmarks.jar 
...
 Performance counter stats for 'java -jar target/benchmarks.jar':

        203,448.61 msec task-clock                       #    1.000 CPUs utilized             
            32,758      context-switches                 #  161.014 /sec                      
                 0      cpu-migrations                   #    0.000 /sec                      
            52,939      page-faults                      #  260.208 /sec                      
 1,437,986,081,591      instructions                     #    2.73  insn per cycle            
   527,696,589,866      cycles                           #    2.594 GHz                       
   132,646,534,211      branches                         #  651.990 M/sec                     
       109,496,026      branch-misses                    #    0.08% of all branches           
```

### Why are there so many context-switches and page-faults?
**Context switches**
- We are using JMH and it runs many threads for its own bookkeeping
- We are limiting our process to use only 2 cores. So obviously multiple threads will use the same CPU.

**Page-faults**
- Even though our application needs a very minimal memory, it's not so small to fit into few pages.
- There will be many class files which needs to loaded, many objects that JMH instantiates, they will need memory.

### What next?
- We can pre-allocate the heap memory for Java using Xms. 2GB should be enough. Lets do that

```
$ taskset -c 6-7 perf stat java -Xms2G -jar target/benchmarks.jar
...
 Performance counter stats for 'java -Xms2G -jar target/benchmarks.jar':

        203,532.75 msec task-clock                       #    1.000 CPUs utilized             
            32,921      context-switches                 #  161.748 /sec                      
                 0      cpu-migrations                   #    0.000 /sec                      
            56,763      page-faults                      #  278.889 /sec                      
 1,445,059,397,128      instructions                     #    2.74  insn per cycle            
   527,913,107,582      cycles                           #    2.594 GHz                       
   133,282,584,664      branches                         #  654.846 M/sec                     
       110,015,439      branch-misses                    #    0.08% of all branches           

     203.602838149 seconds time elapsed

     202.886203000 seconds user
       0.677227000 seconds sys
```

Wow! that didn't go well, did it? The number of page faults increased. 

### About memory allocation in Linux

- Let's say we do a libc's `malloc` (or any allocator in general) and if there is no heap space available, libc will ask the kernel extend its memory segment using `brk`/`sbrk` syscall. Kernel just updates it segment tables (if there is enough memory or policy allows it). There are no real frames allocated.

- Real frames are allocated when there is a page fault when process tries to access the memory area. We can verify this by simple program (Notice the VIRT and RES value)

  ```bash
  $ cat test.c 
  main() {
    malloc(1024 * 1024 * 1024);   // allocate a GB
    while(1);
  }

  $ gcc test.c
  $ ./a.out &
  [2] 41418

  $ top -p 41418
      PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND  
    41418 mpataki   20   0 1051264   1216   1116 R 100.0   0.0   0:09.77 a.out 
  ```

- In our case, even if we set `-Xms2G` page faults will still occur **during benchmarking affecting our results**. Lil bit of research and I found a Java flag `-XX:+AlwaysPreTouch` which will basically allocate `Xms` and access the memory in every page so frames are allocated for us when the benchmark starts running.


- But just this won't guarantee 0 page faults when benchmark starts. Swapping can happen and we can still see page faults. So lets disable that too.

Disable swapping
```
$ sudo swapoff -a
```

Now let's run the benchmark. Fingers crossed 🤞 (I chose the processors 10-11 this time because I noticed NVME interrupts still getting scheduled on proc 6-9)

```
$ taskset -c 10-11 java -Xms2G -XX:+AlwaysPreTouch -jar target/benchmarks.jar   
...

# Run progress: 0.00% complete, ETA 00:03:20
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 138.797 ops/s
# Warmup Iteration   2: 138.554 ops/s
# Warmup Iteration   3: 138.861 ops/s
# Warmup Iteration   4: 139.438 ops/s
# Warmup Iteration   5: 138.324 ops/s
Iteration   1: 138.816 ops/s
Iteration   2: 138.898 ops/s
Iteration   3: 138.041 ops/s
Iteration   4: 139.100 ops/s
Iteration   5: 138.962 ops/s

# Run progress: 50.00% complete, ETA 00:01:42
# Fork: 1 of 1
# Warmup Iteration   1: 138.110 ops/s
# Warmup Iteration   2: 139.605 ops/s
# Warmup Iteration   3: 139.440 ops/s
# Warmup Iteration   4: 139.204 ops/s
# Warmup Iteration   5: 138.407 ops/s
Iteration   1: 138.894 ops/s
Iteration   2: 138.409 ops/s
Iteration   3: 138.683 ops/s
Iteration   4: 138.871 ops/s
Iteration   5: 138.744 ops/s


Result "com.mpataki.Tensor4DBenchmark.accessTest":
  138.720 ±(99.9%) 0.751 ops/s [Average]
  (min, avg, max) = (138.409, 138.720, 138.894), stdev = 0.195
  CI (99.9%): [137.969, 139.471] (assumes normal distribution)

# Run complete. Total time: 00:03:24

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    5  138.720 ± 0.751  ops/s
```

The results look very promising but I am still not convinced as number are still varying (please forgive me 😝). Me and my brother had a weird reasoning for these which we will explore in the next episode.

**<center>Until then, wish you a great year ahead</center>**
