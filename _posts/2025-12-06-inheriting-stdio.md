---
tags: linux c
category: Programming
title: Linux stdio inheritance
date: 2025-12-06 17:51:00 +05:30
---

Until recently I had a notion that all processes in the linux have 3 fds open when they start. During a recent office-training-discussion, I felt this might not be true. They might just be inheriting these from their parent process.

So here is a test...


### grand parent
```
# cat grand_parent.c 
#include <unistd.h>
int main(int c, char **argv) {
	if(fork() != 0) {
		while(1);	// parent, dont die
	} else {
		close(0);
		close(1);
		close(2);       // close all fds for your child
		execve(argv[1], argv, NULL);
	}
}
```

### parent and child
```
# cat parent_n_child.c 
#include <unistd.h>
int main() {
	fork();
	while(1);               // both parent and child hang here
}
```

### The test
```
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

```
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
