---
tags: linux c
category: programming
title: Linux stdio inheritance
date: 2025-12-06 17:51:00 +05:30
---

Until recently I had a notion that all processes in the linux have 3 fds open when they start. During a recent office-training-discussion, I felt this might not be true. They might just be inheriting these from their parent process.

So here is a test...


### grand parent
```c
# cat grand_parent.c 
#include <unistd.h>
int main(int c, char **argv) {
	if(fork() != 0) {
		while(1);		// dont die
	} else {
		close(0);
		close(1);
		close(2);       // close all fds for your child
		execve(argv[1], argv, NULL);
	}
}
```

### parent and child
```c
# cat parent_n_child.c 
#include <unistd.h>
int main() {
	fork();
	while(1);               // both parent and child hang here
}
```

### The test
```bash
#gcc parent_n_child.c -o parent_n_child
#gcc grand_parent.c -o grand_parent
#./grand_parent $PWD/parent_n_child &
[1] 812798

#pstree -pa 812798
grand_parent,812798 /home/mpataki/test/parent_n_child
  └─parent_n_child,812799 /home/mpataki/test/parent_n_child
      └─parent_n_child,812800 /home/mpataki/test/parent_n_child

#ls -l /proc/812798/fd
total 0
lrwx------ 1 mpataki mpataki 64 Dec  6 17:40 0 -> /dev/pts/1
lrwx------ 1 mpataki mpataki 64 Dec  6 17:40 1 -> /dev/pts/1
lrwx------ 1 mpataki mpataki 64 Dec  6 17:40 2 -> /dev/pts/1

#ls -l /proc/812799/fd
total 0

#ls -l /proc/812800/fd
total 0

```

I had to have 3 levels in my test because parent is closing its fd after the fork. 

### A more simpler test ;)

```bash
# ./parent_n_child 0>&- 1>&-1 2>&- &
[1] 819148

# pstree -pa 819148
parent_n_child,819148 1
  └─parent_n_child,819149 1

# ls -l /proc/819148/fd
total 0

# ls -l /proc/819149/fd
total 0
```

One more test to validate whether parent process (like shell sets up the stdio) :: Although above code obviously disprooves it.

```bash
# strace -f -e open,openat,dup,dup2 bash
... too much output ...

# ls > /dev/null
strace: Process 835106 attached
[pid 835106] openat(AT_FDCWD, "/dev/null", O_WRONLY|O_CREAT|O_TRUNC, 0666) = 3
[pid 835106] dup2(3, 1)                 = 1
[pid 835106] execve("/usr/bin/ls", ["ls", "--color=auto"], 0x5b0ab21081b0 /* 52 vars */) = 0
...
[pid 835106] +++ exited with 0 +++
--- SIGCHLD {si_signo=SIGCHLD, si_code=CLD_EXITED, si_pid=835106, si_uid=1000, si_status=0, si_utime=0, si_stime=0} ---

# ls
strace: Process 835219 attached
[pid 835219] execve("/usr/bin/ls", ["ls", "--color=auto"], 0x5b0ab21081b0 /* 52 vars */) = 0
...
[pid 835219] +++ exited with 0 +++
--- SIGCHLD {si_signo=SIGCHLD, si_code=CLD_EXITED, si_pid=835219, si_uid=1000, si_status=0, si_utime=0, si_stime=0} ---

```

So its the child who reopens/redirects the fds. Some pattern like below.

```c
if(fork() != 0) {
	// parent continues
} else {
	// reopen if required
	if(redirect_1) {
		dup2(...);
	}
	...
	execve(...);
}
```
