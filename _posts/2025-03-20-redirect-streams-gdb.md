---
tags: gdb linux hack
category: programming
title: Redirect/Reopen a existing stream in Linux
date: 2025-03-20 23:21:00 +05:30
---

Self explanatory 😁

```
[root@invention03 ~]# yes > /dev/null &
[1] 2435921

[root@invention03 ~]# ls -l /proc/2435921/fd
total 0
lrwx------ 1 root root 64 Mar 20 23:17 0 -> /dev/pts/2
l-wx------ 1 root root 64 Mar 20 23:17 1 -> /dev/null
lrwx------ 1 root root 64 Mar 20 23:17 2 -> /dev/pts/2

[root@invention03 ~]# gdb -q -p 2435921
...
(gdb) call (int)dup2((int)open("/tmp/new_output.txt", 577, 0644), 1)
$1 = 1
quit)
A debugging session is active.

        Inferior 1 [process 2435921] will be detached.

Quit anyway? (y or n) y
Detaching from program: /usr/bin/yes, process 2435921
[Inferior 1 (process 2435921) detached]

[root@invention03 ~]# ls -l /proc/2435921/fd
total 0
lrwx------ 1 root root 64 Mar 20 23:17 0 -> /dev/pts/2
l-wx------ 1 root root 64 Mar 20 23:17 1 -> /tmp/new_output.txt
lrwx------ 1 root root 64 Mar 20 23:17 2 -> /dev/pts/2
l-wx------ 1 root root 64 Mar 20 23:18 3 -> /tmp/new_output.txt
```
