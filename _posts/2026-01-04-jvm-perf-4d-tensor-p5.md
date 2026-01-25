---
tags: linux performance arm benchmark android simpleperf adb aarch64
category: programming
title: "Part 5: My superfast right ARM, the phone"
date: 2026-01-23 10:00:00 +05:30
---

Ahoy there! Welcome to part 5 of this series.

> For those who landed here directly, this is the part 5 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at all the previous posts before reading this.

This is a surprise episode where I abandon my powerful (cough) laptop and run the benchmark on my [Moto Edge 40 Neo](https://www.gsmarena.com/motorola_edge_40_neo-12467.php) phone which runs on a MediaTek dimnesity 7030 with 12G RAM (uMCP which is LPDDR5).

To get the binaries set up for running my benchmark, I am using a Android app named [Termux](https://wiki.termux.com/) from playstore and installed below packages. It also allows me [SSH in to the my phone](https://wiki.termux.com/wiki/Remote_Access). If you are interested in just exploring, you can go for `adb` as well.

- openjdk-25-x
- git
- maven


The vanilla results were very surprising (for reference the avg thruput in my computer was ~135 ops/s).

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

What the heck! My phone is executing code better than my laptop? I checked the CPU details and it was also surprising. Here is the `lscpu` output

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

## There are two type of processors?
- Mobile phone companies pack two clusters (sometimes [more](https://nanoreview.net/en/soc-list/rating)) of different type of cores in a phone. OS runs tasks on these cores depending on the phone state (active / going to sleep / locked) to minimize power usage and improve the user experience.

- The design of the phone h/w (aka Soc - System on Chip) is also different than laptops. CPU cores, Memory Controller, GPU, NPU, Modem, ISP (Image Signal Processor), DSP (Digital Signal Processor) are all put on a single chip. If you are interested in researching more, these are some good starting points to pick keywords.

  - [Nextpit - SoC, components, market players etc.](https://www.nextpit.com/how-tos/smartphone-socs-explained)
  - [Nanoreview - Ratings of SoCs](https://nanoreview.net/en/soc-list/rating)


It seems, in Android we don't have much freedom, unless we root the device and since I have only one device, I don't plan to do it. But the Android platform tools (Android Studio) gives us a little space to experiment. To use it, we need to enable developer options and USB debugging on the phone and connect the phone to the computer using USB and accept USB debugging the phone.

Once done, you can run the command `adb shell` and you get into the phone with some good capabilities (to access `/sys` and `/proc` fs).

There are a lot of interesting binaries you can find on the phone amd I found `simpleperf`, `taskset` (somewhat mimicking the linux counterparts) and `getconf` (gets some config including h/w details) somewhat useful for my experiments. 


## Running the benchmark with the `simpleperf`

Android platform-tools (shipped with Android studio) have a binary named `simpleperf` which is very similar to `perf` but to my surprise my device had it at `/system/bin`.

Since I was looking for how this small, cheap device was sooo good at the benchmark, I was naturally interesed to see the stats. Running the benchmark with `simpleperf` was really fun (cough painful) due to Android's nuances. Here are my experiments -

## Experiment 1: Running via termux

I thought it was as simple as `/system/bin/simpleperf stat ...` but no. I couldn't use it via termux as it's coded to not run when invoked thru an app user ([source](https://android.googlesource.com/platform/system/extras/+/master/simpleperf/workload.cpp#36)). 

> **App user** - Android maintains a user per application

So I came up with this workaround (which I will run from `adb`)

```bash
$ simpleperf stat \
   /system/bin/run-as com.termux \
    files/usr/bin/java -jar tensor.benchmark-main/target/benchmarks.jar
```

### Idea behind this approach

1. `run-as` is an android debug utility which helps in running programs in context of other users.

2. But the `run-as` requires the app to be marked as **debuggable**. For this, I got the source code of [`Termux`](https://github.com/termux/termux-app), made it debuggable (steps below), compiled and installed it on my phone.

    > **NOTE: if you already have termux installed, you will loose the data of that app**

    ```xml
    <!-- changes I did to app/src/main/AndroidManifest.xml >
    ...
      <application
        ...
        android:debuggable="true"
        tools:ignore="HardcodedDebugMode">
    ...
    ```

3. Once the app is installed, I had to install the required packages again (see above) and compile my benchmark.

4. Connect via `adb` as `shell` user and run the benchmark with `simpleperf`.

### Stats from `simpleperf`

The stats were really weird. See the task-clock and page-faults. 0 PFs, really?

```bash
#        count  event_name                # count / runtime
       110,044  cpu-cycles                # 1.064410 GHz      
        14,797  stalled-cycles-frontend   # 143.125 M/sec     
        74,950  stalled-cycles-backend    # 724.960 M/sec     
        25,018  instructions              # 241.989 M/sec     
           585  branch-misses             # 5.658 M/sec       
  0.108230(ms)  task-clock                # 0.000001 cpus used
             0  context-switches          # 0.000 /sec        
             0  page-faults               # 0.000 /sec  
```

To confirm whether I was getting real results, I did a small test

```bash
$ simpleperf stat -e cpu-cycles ls
...
Performance counter statistics:
#      count  event_name   # count / runtime
  18,805,994  cpu-cycles   # 0.930426 GHz
Total test time: 0.022808 seconds.


$ simpleperf stat -e cpu-cycles /system/bin/run-as com.termux ls
...
Performance counter statistics:
#  count  event_name   # count / runtime
  85,303  cpu-cycles   # 0.777114 GHz
Total test time: 0.038096 seconds.
```

Something is wrong when I profile the program invoked via `run-as`. It seems simpleperf doesn't follow the process heirarchy. So this was a deadend.


## Experiment 2: Profile the termux app 

I found that there is an option to perf an android application hoping simpleperf will follow the process heirarchy. This was my approach

1. Start the profiler in adb shell.

    ```bash
    $ simpleperf stat --app com.termux
    ```

2. Run the application on termux (thru SSH / termux app ui itself, you can keep the command typed before step 1 and hit enter once you start profiling)

    ```bash
    $ java -jar target/benchmarks.jar -wi 2 -i 2
    ```

3. Stop profiling (Ctrl+C) after the benchmark process finishes


### Results

Although the results had some huge numbers, the task-clock again revealed it's all useless.

```
$ simpleperf stat --app com.termux
^CPerformance counter statistics:

#           count  event_name                # count / runtime
    2,326,910,321  cpu-cycles                # 1.969961 GHz      
      565,468,992  stalled-cycles-frontend   # 465.821 M/sec     
      849,928,935  stalled-cycles-backend    # 704.037 M/sec     
    2,701,203,792  instructions              # 2.243 G/sec       
        6,660,805  branch-misses             # 5.658 M/sec       
  1331.798921(ms)  task-clock                # 0.014056 cpus used
            1,955  context-switches          # 1.468 K/sec       
              749  page-faults               # 562.397 /sec      

Total test time: 94.750378 seconds.
```



## Experiment 3: Run everything in adb shell

### Idea

1. I have JDK, C-runtime library (required by Java) in the Termux app (`/data/data/com.termux/files/usr` directory) and since I have installed a debuggable instance of the Termux on my phone, these files are accessible from Android studio (file browser).

2. I need to copy the files in the following order: Termux App directory -> Laptop -> Shell app directory. To do the second copy, I used `adb`.

    ```
    $ adb push usr /data/local/tmp/bins/
    $ adb push benchmarks.jar /data/local/tmp/
    ```

3. Once files are ready, we need to setup `PATH`, `LD_LIBRARY_PATH` and we are good to go.

### Execution
1. The env setup

    ```bash
    LP=/system/lib64:/vendor/lib64                            # android libs
    LP=$LP:/data/local/tmp/bins/lib                           # c library
    LP=$LP:/data/local/tmp/bins/lib/jvm/java-25-openjdk/lib   # java libs
    
    export LD_LIBRARY_PATH=$LP
    export PATH=$PATH:/data/local/tmp/bins/bin
    ```

2. The permission bits

    ```bash
    cd /data/local/tmp/bins
    chmod +x bin/*
    chmod +x lib/jvm/java-25-openjdk/lib/*
    chmod +x lib/jvm/java-25-openjdk/bin/*
    ```

3. The run (for some reason the java was creating temp files in termux app's private directory, so I had to reset it to `/tmp`)

    ```bash
    java -Djava.io.tmpdir=/tmp -jar benchmarks.jar
    ```


### Results - Surprise, surprise!

```
$ java -Djava.io.tmpdir=/tmp -jar benchmarks.jar
...

Benchmark                      Mode  Cnt   Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    5  29.760 ± 0.047  ops/s
...
```

Apparently, my phone was locked and due to that the benchmark ran on cores 0-5 (which are Cortex-A55) which are optimized for powersave mode. To verify this I ...

ran it on performance core (192 is mask for processor 6,7. 192 = 11000000 in binary)
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

Now if you scroll up to see the frequency of these cores, they are 2400MHz and 2000MHz which is not in the same ratio as their performance. So what's the difference?

For this we need to see the complete perf output

#### Cortex A-55
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

#### Cortex A-78
```bash
$ taskset 192 simpleperf stat java -Djava.io.tmpdir=/tmp -jar benchmarks.jar -wi 0 -i 1
...
Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt       210.361          ops/s

Performance counter statistics:

#            count  event_name                # count / runtime
    45,580,956,762  cpu-cycles                # 2.358157 GHz      
     2,195,865,743  stalled-cycles-frontend   # 113.596 M/sec     
    12,975,768,615  stalled-cycles-backend    # 671.116 M/sec     
   149,786,430,843  instructions              # 7.742 G/sec       
        60,366,459  branch-misses             # 3.124 M/sec       
  23738.725052(ms)  task-clock                # 1.063421 cpus used
             7,162  context-switches          # 301.701 /sec      
            45,111  page-faults               # 1.900 K/sec       

Total test time: 22.322981 seconds.
```

### Do you see it?
Look at
- instructions/sec
- branch-misses
- stalled-cycle-backend


## What's happening?
I am using Chat to gather the CPU design numbers and studying them against my benchmark, so we will see this and compare it with my fat i7 CPU in the next episode. Matane!

