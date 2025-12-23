---
tags: java jvm performance jit benchmark
category: programming
title: "Part 1: Baseline and JIT compilers"
date: 2025-12-19 00:10:00 +05:30
---

Hey!! You kept reading... welcome back!

> <span style="font-size: 0.8em">For those who landed here directly, this is the part 1 of the series - [Taking JVM on a performance ride (4D tensor)]({% post_url 2025-12-18-jvm-perf-4d-tensor %}). I suggest you to take a look at the intro page before reading this.</span>

<br>

Code and results referred here are present in [mmpataki/tensor.benchmark](https://github.com/mmpataki/tensor.benchmark), you can get them and reproduce the results on your computer by -

```bash
# clone the repo
$ git clone https://github.com/mmpataki/tensor.benchmark

# if already cloned, pull
$ git pull

# checkout the branch used for this part
$ cd tensor.benchmark
$ git checkout p1-baseline-and-jit-compilers

# build the benchmark
$ mvn clean package

# run it
$ java -jar target/benchmarks.jar
```
<br>

To begin with, I decided to use a 4D array to represent this tensor and to measure the element access performance, I created a JMH benchmark as follows

```java
@State(Scope.Benchmark)
public class Tensor4DBenchmark {

    final int B_DIM = 64;
    final int CH_DIM = 16;
    final int R_DIM = 28;
    final int C_DIM = 32;
    float[][][][] arr = new float[B_DIM][CH_DIM][R_DIM][C_DIM];

    public float realTest() {
        float sum = 0;
        for (int i = 0; i < 1_000_000; i++) {
            // access elements at pseudo random locations
            int b = i % B_DIM,
                ch = i % CH_DIM,
                r = i % R_DIM,
                c = i % C_DIM;
            sum += arr[b][ch][r][c];
        }
        return sum;
    }

    @Benchmark
    @Fork(value = 1, warmups = 1)
    public void accessTest(Blackhole bh) {
        float ret = realTest();
        bh.consume(ret);
    }

}
```

What this code does
- Sets up a 4D array with shape 64 x 16 x 28 x 32.
- Does pseudo random element access a million times.
- Using JMH, measures the throughput

<br>

## Results from my machine

- [complete results](https://github.com/mmpataki/tensor.benchmark/blob/master/observations/p1-baseline-and-jit-compilers/benchmark_output.txt)
- [specs of my machine]({% post_url 2025-12-18-jvm-perf-4d-tensor %})

```bash
$ java -jar target/benchmarks.jar
# JMH version: 1.37
# VM version: JDK 24.0.2-internal, OpenJDK 64-Bit Server VM, 24.0.2-internal-adhoc.mpataki.jdk24u
# VM invoker: /home/mpataki/projects/jdk24u/build/linux-x86_64-server-release/jdk/bin/java
# VM options: <none>
# Blackhole mode: compiler (auto-detected, use -Djmh.blackhole.autoDetect=false to disable)
# Warmup: 5 iterations, 10 s each
# Measurement: 5 iterations, 10 s each
# Timeout: 10 min per iteration
# Threads: 1 thread, will synchronize iterations
# Benchmark mode: Throughput, ops/time
# Benchmark: com.mpataki.Tensor4DBenchmark.accessTest

# Run progress: 0.00% complete, ETA 00:03:20
# Warmup Fork: 1 of 1
# Warmup Iteration   1: 140.104 ops/s
# Warmup Iteration   2: 140.242 ops/s
# Warmup Iteration   3: 140.198 ops/s
# Warmup Iteration   4: 140.141 ops/s
# Warmup Iteration   5: 139.711 ops/s
Iteration   1: 139.656 ops/s
Iteration   2: 139.656 ops/s
Iteration   3: 139.573 ops/s
Iteration   4: 139.637 ops/s
Iteration   5: 139.710 ops/s

# Run progress: 50.00% complete, ETA 00:01:40
# Fork: 1 of 1
# Warmup Iteration   1: 134.888 ops/s
# Warmup Iteration   2: 135.329 ops/s
# Warmup Iteration   3: 135.202 ops/s
# Warmup Iteration   4: 135.041 ops/s
# Warmup Iteration   5: 134.735 ops/s
Iteration   1: 134.285 ops/s
Iteration   2: 134.274 ops/s
Iteration   3: 134.330 ops/s
Iteration   4: 134.755 ops/s
Iteration   5: 134.599 ops/s


Result "com.mpataki.Tensor4DBenchmark.accessTest":
  134.449 ±(99.9%) 0.834 ops/s [Average]
  (min, avg, max) = (134.274, 134.449, 134.755), stdev = 0.217
  CI (99.9%): [133.614, 135.283] (assumes normal distribution)


# Run complete. Total time: 00:03:21
...

Benchmark                      Mode  Cnt    Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    5  134.449 ± 0.834  ops/s
```

So we were able to execute the accessTest method 134 times per second which is 134M element accesses per second. Can we push this further?

<br>

## Execution of a Java code

We were taught in our schools that JVM interprets the bytecode which makes it platform independent. But this is not entirely true. By default JVM optimizes and compiles our bytecode to machine code and lets it run on CPU. 

If you don't believe me, there is a way we can make our code run completely in interpreted mode (using `-Xint` flag). Take a peek at the below numbers, Interpreted code is 8X slower compared to our initial run.

```bash
$ java -Xint -jar target/benchmarks.jar
...

Result "com.mpataki.Tensor4DBenchmark.accessTest":
  17.235 ±(99.9%) 0.473 ops/s [Average]
  (min, avg, max) = (17.100, 17.235, 17.372), stdev = 0.123
  CI (99.9%): [16.762, 17.708] (assumes normal distribution)

Benchmark                      Mode  Cnt   Score   Error  Units
Tensor4DBenchmark.accessTest  thrpt    5  17.235 ± 0.473  ops/s
```

<br>

So I went on reading about the compilation in JVM, and while reading [[1]](#references), [[2]](#references), [[3]](#references) I found out that this compilation and optimization is tiered and there are 5 levels of it as shown below. I strongly suggest you spend some time reading [1] to understand these tiers better.

```
    Level 0      - Interpreted
    Level 1-3    - C1 (client compiler)
            1       - w/o profiling
            2       - w basic profiling
            3       - w full profiling
    Level 4      - C2 (server compiler)
```

<br>

> **TL;DR**  
>   JVM initially interprets the bytecode and keep tracks of the counts of method invocation and loop iterations (and many other stuff). This is called profiling. As these numbers increase, it decides to compile and optimize the methods and loops.

<br>


### References
- [1] - [https://devblogs.microsoft.com/java/how-tiered-compilation-works-in-openjdk/](https://devblogs.microsoft.com/java/how-tiered-compilation-works-in-openjdk/)
- [2] - [https://docs.oracle.com/en/java/javase/11/jrockit-hotspot/compilation-optimization.html](https://docs.oracle.com/en/java/javase/11/jrockit-hotspot/compilation-optimization.html)
- [3] - [https://cr.openjdk.org/~vlivanov/talks/2015_JIT_Overview.pdf#page=49.00](https://cr.openjdk.org/~vlivanov/talks/2015_JIT_Overview.pdf#page=49.00)

<br>

## Did our run use Tiered compilation? 
Let's check that. `-XX:+PrintFlagsFinal` prints all the effective flags JVM is using.

```bash
$ java -XX:+PrintFlagsFinal -jar target/benchmarks.jar | grep TieredCompilation
     ...
     bool TieredCompilation                 = true            {pd product} {default}
     ...
```
Cool! tiered compilation is already in use.

<br>

## Is C2 in use?
Let's see whether C2 has compiled our code. In order to do this, we can enable the compilation related logging using the flag `PrintCompilation`.

```bash
$ java -XX:+PrintCompilation -jar target/benchmarks.jar | grep realTest
1300 1053      1 468  945 %     3       com.mpataki.Tensor4DBenchmark::realTest @ 4 (59 bytes)
468  946       3                        com.mpataki.Tensor4DBenchmark::realTest (59 bytes)
469  947 %     4                        com.mpataki.Tensor4DBenchmark::realTest @ 4 (59 bytes)
475  945 %     3                        com.mpataki.Tensor4DBenchmark::realTest @ 4 (59 bytes)   made not entrant
480  947 %     4                        com.mpataki.Tensor4DBenchmark::realTest @ 4 (59 bytes)   made not entrant
481  948 %     4                        com.mpataki.Tensor4DBenchmark::realTest @ 4 (59 bytes)
488  949       4                        com.mpataki.Tensor4DBenchmark::realTest (59 bytes)
494  946       3                        com.mpataki.Tensor4DBenchmark::realTest (59 bytes)   made not entrant
```

I couldn't find any doc explaining the columns, so took help from Chat and according to it
```
Col3 - %            indicates OSR optimization (replacing loops)
Col4 - [1-4]        represents the tier
`@ 4`               represents the byte code index at which the OSR is done
`made not entrant`  means the code block with attributes (represented by Col3, 4 in that line) is discarded
```

So looking at the last two lines, we can conclude our code (`realTest` method) is indeed compiled by C2.

I'll stop here, but you can continue exploring other flags available for compiler configuration in above mentioned documents. Play with them and share your findings with me.

In the next episode of this series, we will dive deeper in to the code generated by the C2 compiler and try to optimize it.
