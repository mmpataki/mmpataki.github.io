---
tags: java jvm performance jit benchmark
category: programming
title: Taking JVM on a performance ride (4D tensor)
date: 2025-12-18 08:30:00 +05:30
---


This is a series of mad hunt (exploration) for performance (throughput) with JVM using a 4D tensor as an example. The idea is to explore options available and limits in JVM for performance tuning of a silly application.

<br>

## Objective of this exploration
- Implement a 4D tensor with optimized element access.
	- This basic optimization can improve the performance of other operations on this tensor
- Explore optimizations in (known to me r.n)
	- Source code
	- Cache behavior
	- Context switches
	- JIT tuning
	- Offheap memory
	- ...
- Since Java is a robust, hybrid (interpreted / compiled) language, performance won't be comparable to C / C++. So we are just trying to push the boundaries of Java implementation.

<br>

> **Background**  
> It all started when I was implementing a CNN (LeNet) in Java for exploring ML basics. I started with C -- missed classes, went to C++ -- realized I had forgotten the syntax and finally ended up with Java (which is my go-to PL rn).

<br>

## Elephant in the room : what is a 4D tensor?
For this series, we will keep the definition of tensor simple. If you are aware of scalars, vectors & matrices, tensor is a generalization of these ideas to more dimensions. For others consider it as a multi-dimensional array.

For this series, we will keep the shape of the tensor to 4 dimensions (4 dimensional array)


## Index
1. [Baseline and JIT compilers]({% post_url 2025-12-19-jvm-perf-4d-tensor-p1 %})
2. [JIT disassembly, compressed oops and task pinning in Linux]({% post_url 2025-12-30-jvm-perf-4d-tensor-p2 %})
3. [CPU isolation, IRQs and memory-mgmt]({% post_url 2026-01-01-jvm-perf-4d-tensor-p3 %})
4. [CPU temperature, frequency and MSRs]({% post_url 2026-01-17-jvm-perf-4d-tensor-p4 %})

<br>

## Source code and results
All code and results can be found in my Github - [mmpataki/tensor.benchmark](https://github.com/mmpataki/tensor.benchmark)


<br>

## For Java experts
I am a novice Java programmer trying to explore the limits of Java. Suggestions, directions are very much welcome. You can hit me up on

- Comments below
- [LinkedIn](https://www.linkedin.com/in/madhusoodan-pataki/)
- [X (twitter)](https://x.com/mmpataki)
- Email - akshayapataki123 AT gmail DOT com


<br>

## My Machine, OS, JDK

### JDK
I have compiled it because I needed hsdis (so I can inspect the generated machine code)
```bash
$ java --version
openjdk 24.0.2-internal 2025-07-15
OpenJDK Runtime Environment (build 24.0.2-internal-adhoc.mpataki.jdk24u)
OpenJDK 64-Bit Server VM (build 24.0.2-internal-adhoc.mpataki.jdk24u, mixed mode)
```


### OS
```bash
$ uname -a
Linux kurukshetra 6.14.0-36-generic #36~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Oct 15 15:45:17 UTC 2 x86_64 x86_64 x86_64 GNU/Linux
```

### Machine
```bash
$ lscpu
Architecture:                x86_64
  CPU op-mode(s):            32-bit, 64-bit
  Address sizes:             39 bits physical, 48 bits virtual
  Byte Order:                Little Endian
CPU(s):                      12
  On-line CPU(s) list:       0-11
Vendor ID:                   GenuineIntel
  Model name:                Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
    CPU family:              6
    Model:                   158
    Thread(s) per core:      2
    Core(s) per socket:      6
    Socket(s):               1
    Stepping:                10
    CPU(s) scaling MHz:      18%
    CPU max MHz:             4500.0000
    CPU min MHz:             800.0000
    BogoMIPS:                5199.98
    Flags:                   fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36
                              clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe syscall nx pdpe1gb rdt
                             scp lm constant_tsc art arch_perfmon pebs bts rep_good nopl xtopology n
                             onstop_tsc cpuid aperfmperf pni pclmulqdq dtes64 monitor ds_cpl vmx est
                              tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid sse4_1 sse4_2 x2apic movbe popc
                             nt tsc_deadline_timer aes xsave avx f16c rdrand lahf_lm abm 3dnowprefet
                             ch cpuid_fault epb pti ssbd ibrs ibpb stibp tpr_shadow flexpriority ept
                              vpid ept_ad fsgsbase tsc_adjust bmi1 avx2 smep bmi2 erms invpcid mpx r
                             dseed adx smap clflushopt intel_pt xsaveopt xsavec xgetbv1 xsaves dther
                             m ida arat pln pts hwp hwp_notify hwp_act_window hwp_epp vnmi md_clear 
                             flush_l1d arch_capabilities
Virtualization features:     
  Virtualization:            VT-x
Caches (sum of all):         
  L1d:                       192 KiB (6 instances)
  L1i:                       192 KiB (6 instances)
  L2:                        1.5 MiB (6 instances)
  L3:                        12 MiB (1 instance)
NUMA:                        
  NUMA node(s):              1
  NUMA node0 CPU(s):         0-11
```