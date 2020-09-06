---
tags: build jdk fedora jdk8
---

This blog lists out the steps to build JDK 8 on Fedora 31. I had some compilation problems while building it, so you may find this useful.


1. I was building the openjdk 8u, so we have to clone it from the public repo
```bash
$ hg clone http://hg.openjdk.java.net/jdk8u/jdk8u
```

2. This will just bring some source and scripts which are necessary to get the actual JDK and hotspot sources.

3. To get the actual sources, run the utility shell script
```bash
$ ./get_source.sh
```

4. Configure the build for your system
```bash
$ bash configure
```

5. Add below options if you want debug symbols
```bash
$ bash configure --with-debug-level=slowdebug
```

6. Set the environment variable to resolve the compilation errors
```bash
$ export CFLAGS="-Wno-return-type"
```

7. Run the build
```bash
$ make
```

#### Little more info

**gcc version**
```bash
$ gcc --version  
gcc (GCC) 9.2.1 20190827 (Red Hat 9.2.1-1)  
Copyright (C) 2019 Free Software Foundation, Inc.  
This is free software; see the source for copying conditions.  There is NO  
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```
