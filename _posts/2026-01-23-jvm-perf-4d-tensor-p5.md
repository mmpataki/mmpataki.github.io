---
tags: linux performance arm benchmark
category: programming
title: "Part 4: CPU temperature, frequency and MSRs"
date: 2026-01-17 14:02:00 +05:30
---
Ahoy there! Welcome to part 5 of this series.

> For those who landed here directly, this is the part 4 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at all the previous posts before reading this.

This is a surprise episode where I abandon my powerful (cough) laptop and run the benchmark on my phone [Moto Edge 40 Neo](https://www.gsmarena.com/motorola_edge_40_neo-12467.php) phone which runs on a MediaTek dimnesity 7030 (2.5GHz) with 12G RAM (uMCP which is LPDDR5).

To get the binaries set up for running my benchmark, I am using a Android app named `Termux` from playstore and installed below packages. It also allows me [SSH in to the my phone](https://wiki.termux.com/wiki/Remote_Access)

- openjdk-25-x
- git


The vanilla results were very surprising for me (for reference the avg throughput in my computer was ~135 ops/s).

```
$ java -jar target/benchmarks.jar -wi 3 -i 2
# JMH version: 1.37
# VM version: JDK 25.0.1, OpenJDK 64-Bit Server VM, 25.0.1
# VM invoker: /data/data/com.termux/files/usr/lib/jvm/java-25-openjdk/bin/java
# VM options: <none>
# Blackhole mode: compiler (auto-detected, use -Djmh.blackhole.autoDetect=false to disable)
# Warmup: 3 iterations, 10 s each
# Measurement: 2 iterations, 10 s each
# Timeout: 10 min per iteration
# Threads: 1 thread, will synchronize iterations
# Benchmark mode: Throughput, ops/time
# Benchmark: com.mpataki.Tensor4DBenchmark.accessTest

# Run progress: 0.00% complete, ETA 00:01:40
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 212.569 ops/s
# Warmup Iteration   2: 213.783 ops/s
# Warmup Iteration   3: 213.111 ops/s
Iteration   1: 213.660 ops/s
Iteration   2: 213.078 ops/s

# Run progress: 50.00% complete, ETA 00:00:50
# Fork: 1 of 1
# Warmup Iteration   1: 216.919 ops/s
# Warmup Iteration   2: 216.471 ops/s
# Warmup Iteration   3: 217.789 ops/s
Iteration   1: 218.036 ops/s
Iteration   2: 215.779 ops/s


Result "com.mpataki.Tensor4DBenchmark.accessTest":
  216.907 ops/s


# Run complete. Total time: 00:01:41

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    2  216.907          ops/s
```

I **had** to check the CPU details and it was also surprising. Here is the relevant `lscpu` output

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

There are two type of CPUs?
