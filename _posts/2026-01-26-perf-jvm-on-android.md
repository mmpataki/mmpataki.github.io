---
tags: perf simpleperf arm benchmark android adb aarch64
category: programming
title: "Profiling JVM applications in Androind with simpleperf"
date: 2026-01-26 01:30:00 +05:30
---

Android platform-tools (shipped with Android studio) have a binary named `simpleperf` which is very similar to `perf` but some devices like mine have it already it at `/system/bin`. Running a Java benchmark with `simpleperf` is really fun (cough painful) due to Android's nuances. Here is what works and what doesn't -

## Experiment 1: Running via termux

I thought it is as simple as `/system/bin/simpleperf stat ...` but no. I couldn't use it via termux as it's coded to not run when invoked thru an app user ([source](https://android.googlesource.com/platform/system/extras/+/master/simpleperf/workload.cpp#36)). 

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



## Experiment 3: Run everything in adb shell (THE WORKING ONE!!)

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

