---
title: Sorting and Sanitizers
tags: sorting, algorithms
category: Programming
---

Title is misleading isn't it? What has sanitizers to do with insertion sort? 

Well one fine day, I was trying to brush-up algoritms and implementation skills so I started with insertion sort. The implementation took around 2mins but the testing ruined around 15mins. This blog just records the problem.

Here is where it all started.

```c++
#include <bits/stdc++.h>
using namespace std;

void isort(int n, int *a) {
	for(int i=1; i<n; i++) {
		int key = a[i];
		int j;
		for(j=i-1; j>=0 && a[j]>key; j--) {
			a[j+1] = a[j];
		}
		a[j] = key;
	}
}

int main(int argc, char ** argv) {
	for(int i=0; i<1000; i++) {
		int r = rand() % 10000;
		int a[r];
		for(int j=0; j<r; j++) {
			a[j] = rand() % 10000;
		}
		
		isort(r, a);
		
		for(int j=1; j<r; j++) {
			assert(a[j-1] <= a[j]);
		}
	}
}
```

Looks pretty good right? When I execute it...
```bash
[mmp@mpataki insertionsort]$ g++ sol.cpp -o sol -g
[mmp@mpataki insertionsort]$ ./sol 
Segmentation fault (core dumped)
```

I thought I will run it with `gdb` to figure out the exception stack.
```bash
[mmp@mpataki insertionsort]$ echo -e "r\nwhere" | gdb -q ./sol | head -n 20
Reading symbols from ./sol...
(gdb) Starting program: /home/mmp/cp/algo/c2/insertionsort/sol 
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.31-4.fc32.x86_64

Program received signal SIGSEGV, Segmentation fault.
0x00000d5400401349 in ?? ()
Missing separate debuginfos, use: dnf debuginfo-install libgcc-10.2.1-1.fc32.x86_64 libstdc++-10.2.1-1.fc32.x86_64
(gdb) 
#0  0x00000d5400401349 in ?? ()
#1  0x0000150a0000150a in ?? ()
#2  0x0000150a0000150a in ?? ()
#3  0x0000150a0000150a in ?? ()
#4  0x0000150a0000150a in ?? ()
#5  0x0000150a0000150a in ?? ()
#6  0x0000150a0000150a in ?? ()
#7  0x0000150a0000150a in ?? ()
#8  0x0000150a0000150a in ?? ()
#9  0x0000150a0000150a in ?? ()
#10 0x0000150a0000150a in ?? ()
#11 0x0000150a0000150a in ?? ()
#12 0x0000150a0000150a in ?? ()
...
```

WTF is there on the stack? `0x*******`? Looks like the stack is corrupt. But which line corrupted it? `gdb` looks definitely not of any help here. So I had do go through each line to figure out the line whic corrupted the stack. It was indeed line 11. Instead of writing to `a[j+1]` I was writing to `a[j]`.

All that is fine, mistakes are possible. But how will we catch them (the cause) in future? After a little googling I found something called sanitizers (there are many of them `asan`, `tsan`, `ubsan`).

`Asan` is address sanitizer which adds a few more instructions to your code to do sanity checks to detect such stack corruptions (possibly it can do more, which I haven't explored much) and can be used as follows

```bash
g++ -fsanitize=address sol.cpp -o sol -g
```

You have to install the `libasan` first
```bash
# Fedora / RHEL
$ sudo yum install libasan
```

Now when I run it (Note it clearly points out the line number 11)
```bash
mmp@mpataki insertionsort]$ ./sol 
=================================================================
==447554==ERROR: AddressSanitizer: dynamic-stack-buffer-overflow on address 0x7fff01150a9c at pc 0x0000004013ea bp 0x7fff01150a40 sp 0x7fff01150a30
WRITE of size 4 at 0x7fff01150a9c thread T0
    #0 0x4013e9 in isort(int, int*) /home/mmp/cp/algo/c2/insertionsort/sol.cpp:11
    #1 0x40159e in main /home/mmp/cp/algo/c2/insertionsort/sol.cpp:23
    #2 0x7f9531820041 in __libc_start_main (/lib64/libc.so.6+0x27041)
    #3 0x40115d in _start (/home/mmp/cp/algo/c2/insertionsort/sol+0x40115d)

Address 0x7fff01150a9c is located in stack of thread T0
SUMMARY: AddressSanitizer: dynamic-stack-buffer-overflow /home/mmp/cp/algo/c2/insertionsort/sol.cpp:11 in isort(int, int*)
Shadow bytes around the buggy address:
  0x100060222100: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222110: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222120: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222130: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222140: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
=>0x100060222150: ca ca ca[ca]00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222160: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222170: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222180: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x100060222190: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  0x1000602221a0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
Shadow byte legend (one shadow byte represents 8 application bytes):
  Addressable:           00
  Partially addressable: 01 02 03 04 05 06 07 
  Heap left redzone:       fa
  Freed heap region:       fd
  Stack left redzone:      f1
  Stack mid redzone:       f2
  Stack right redzone:     f3
  Stack after return:      f5
  Stack use after scope:   f8
  Global redzone:          f9
  Global init order:       f6
  Poisoned by user:        f7
  Container overflow:      fc
  Array cookie:            ac
  Intra object redzone:    bb
  ASan internal:           fe
  Left alloca redzone:     ca
  Right alloca redzone:    cb
  Shadow gap:              cc
==447554==ABORTING
```

Let's see some disassembly and note the sanitizer code.

Before sanitize
```
0000000000401166 <_Z5isortiPi>:
  401166:	55                   	push   %rbp
  401167:	48 89 e5             	mov    %rsp,%rbp
  40116a:	89 7d ec             	mov    %edi,-0x14(%rbp)
  40116d:	48 89 75 e0          	mov    %rsi,-0x20(%rbp)
  401171:	c7 45 fc 01 00 00 00 	movl   $0x1,-0x4(%rbp)
  401178:	8b 45 fc             	mov    -0x4(%rbp),%eax
  40117b:	3b 45 ec             	cmp    -0x14(%rbp),%eax
  40117e:	0f 8d 9c 00 00 00    	jge    401220 <_Z5isortiPi+0xba>
  401184:	8b 45 fc             	mov    -0x4(%rbp),%eax
  401187:	48 98                	cltq   
  401189:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  401190:	00 
  401191:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  401195:	48 01 d0             	add    %rdx,%rax
  401198:	8b 00                	mov    (%rax),%eax
  40119a:	89 45 f4             	mov    %eax,-0xc(%rbp)
  40119d:	8b 45 fc             	mov    -0x4(%rbp),%eax
  4011a0:	83 e8 01             	sub    $0x1,%eax
  4011a3:	89 45 f8             	mov    %eax,-0x8(%rbp)
  4011a6:	83 7d f8 00          	cmpl   $0x0,-0x8(%rbp)
  4011aa:	78 52                	js     4011fe <_Z5isortiPi+0x98>
  4011ac:	8b 45 f8             	mov    -0x8(%rbp),%eax
  4011af:	48 98                	cltq   
  4011b1:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  4011b8:	00 
  4011b9:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  4011bd:	48 01 d0             	add    %rdx,%rax
  4011c0:	8b 00                	mov    (%rax),%eax
  4011c2:	39 45 f4             	cmp    %eax,-0xc(%rbp)
  4011c5:	7d 37                	jge    4011fe <_Z5isortiPi+0x98>
  4011c7:	8b 45 f8             	mov    -0x8(%rbp),%eax
  4011ca:	48 98                	cltq   
  4011cc:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  4011d3:	00 
  4011d4:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  4011d8:	48 01 d0             	add    %rdx,%rax
  4011db:	8b 55 f8             	mov    -0x8(%rbp),%edx
  4011de:	48 63 d2             	movslq %edx,%rdx
  4011e1:	48 83 c2 01          	add    $0x1,%rdx
  4011e5:	48 8d 0c 95 00 00 00 	lea    0x0(,%rdx,4),%rcx
  4011ec:	00 
  4011ed:	48 8b 55 e0          	mov    -0x20(%rbp),%rdx
  4011f1:	48 01 ca             	add    %rcx,%rdx
  4011f4:	8b 00                	mov    (%rax),%eax
  4011f6:	89 02                	mov    %eax,(%rdx)
  4011f8:	83 6d f8 01          	subl   $0x1,-0x8(%rbp)
  4011fc:	eb a8                	jmp    4011a6 <_Z5isortiPi+0x40>
  4011fe:	8b 45 f8             	mov    -0x8(%rbp),%eax
  401201:	48 98                	cltq   
  401203:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  40120a:	00 
  40120b:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  40120f:	48 01 c2             	add    %rax,%rdx
  401212:	8b 45 f4             	mov    -0xc(%rbp),%eax
  401215:	89 02                	mov    %eax,(%rdx)
  401217:	83 45 fc 01          	addl   $0x1,-0x4(%rbp)
  40121b:	e9 58 ff ff ff       	jmpq   401178 <_Z5isortiPi+0x12>
  401220:	90                   	nop
  401221:	5d                   	pop    %rbp
  401222:	c3                   	retq   
```

After sanitizer
```
0000000000401216 <_Z5isortiPi>:
  401216:	55                   	push   %rbp
  401217:	48 89 e5             	mov    %rsp,%rbp
  40121a:	48 83 ec 20          	sub    $0x20,%rsp
  40121e:	89 7d ec             	mov    %edi,-0x14(%rbp)
  401221:	48 89 75 e0          	mov    %rsi,-0x20(%rbp)
  401225:	c7 45 f4 01 00 00 00 	movl   $0x1,-0xc(%rbp)
  40122c:	8b 45 f4             	mov    -0xc(%rbp),%eax
  40122f:	3b 45 ec             	cmp    -0x14(%rbp),%eax
  401232:	0f 8d c0 01 00 00    	jge    4013f8 <_Z5isortiPi+0x1e2>
  401238:	8b 45 f4             	mov    -0xc(%rbp),%eax
  40123b:	48 98                	cltq   
  40123d:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  401244:	00 
  401245:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  401249:	48 8d 0c 02          	lea    (%rdx,%rax,1),%rcx
  40124d:	48 89 c8             	mov    %rcx,%rax
  401250:	48 89 c2             	mov    %rax,%rdx
  401253:	48 c1 ea 03          	shr    $0x3,%rdx
  401257:	48 81 c2 00 80 ff 7f 	add    $0x7fff8000,%rdx
  40125e:	0f b6 12             	movzbl (%rdx),%edx
  401261:	84 d2                	test   %dl,%dl
  401263:	40 0f 95 c7          	setne  %dil
  401267:	48 89 c6             	mov    %rax,%rsi
  40126a:	83 e6 07             	and    $0x7,%esi
  40126d:	83 c6 03             	add    $0x3,%esi
  401270:	40 38 d6             	cmp    %dl,%sil
  401273:	0f 9d c2             	setge  %dl
  401276:	21 fa                	and    %edi,%edx
  401278:	84 d2                	test   %dl,%dl
  40127a:	74 08                	je     401284 <_Z5isortiPi+0x6e>
  40127c:	48 89 c7             	mov    %rax,%rdi
  40127f:	e8 dc fd ff ff       	callq  401060 <__asan_report_load4@plt>
  401284:	8b 01                	mov    (%rcx),%eax
  401286:	89 45 fc             	mov    %eax,-0x4(%rbp)
  401289:	8b 45 f4             	mov    -0xc(%rbp),%eax
  40128c:	83 e8 01             	sub    $0x1,%eax
  40128f:	89 45 f8             	mov    %eax,-0x8(%rbp)
  401292:	83 7d f8 00          	cmpl   $0x0,-0x8(%rbp)
  401296:	0f 88 02 01 00 00    	js     40139e <_Z5isortiPi+0x188>
  40129c:	8b 45 f8             	mov    -0x8(%rbp),%eax
  40129f:	48 98                	cltq   
  4012a1:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  4012a8:	00 
  4012a9:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  4012ad:	48 8d 0c 02          	lea    (%rdx,%rax,1),%rcx
  4012b1:	48 89 c8             	mov    %rcx,%rax
  4012b4:	48 89 c2             	mov    %rax,%rdx
  4012b7:	48 c1 ea 03          	shr    $0x3,%rdx
  4012bb:	48 81 c2 00 80 ff 7f 	add    $0x7fff8000,%rdx
  4012c2:	0f b6 12             	movzbl (%rdx),%edx
  4012c5:	84 d2                	test   %dl,%dl
  4012c7:	40 0f 95 c7          	setne  %dil
  4012cb:	48 89 c6             	mov    %rax,%rsi
  4012ce:	83 e6 07             	and    $0x7,%esi
  4012d1:	83 c6 03             	add    $0x3,%esi
  4012d4:	40 38 d6             	cmp    %dl,%sil
  4012d7:	0f 9d c2             	setge  %dl
  4012da:	21 fa                	and    %edi,%edx
  4012dc:	84 d2                	test   %dl,%dl
  4012de:	74 08                	je     4012e8 <_Z5isortiPi+0xd2>
  4012e0:	48 89 c7             	mov    %rax,%rdi
  4012e3:	e8 78 fd ff ff       	callq  401060 <__asan_report_load4@plt>
  4012e8:	8b 01                	mov    (%rcx),%eax
  4012ea:	39 45 fc             	cmp    %eax,-0x4(%rbp)
  4012ed:	0f 8d ab 00 00 00    	jge    40139e <_Z5isortiPi+0x188>
  4012f3:	8b 45 f8             	mov    -0x8(%rbp),%eax
  4012f6:	48 98                	cltq   
  4012f8:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  4012ff:	00 
  401300:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  401304:	48 8d 34 02          	lea    (%rdx,%rax,1),%rsi
  401308:	8b 45 f8             	mov    -0x8(%rbp),%eax
  40130b:	48 98                	cltq   
  40130d:	48 83 c0 01          	add    $0x1,%rax
  401311:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  401318:	00 
  401319:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  40131d:	48 8d 0c 02          	lea    (%rdx,%rax,1),%rcx
  401321:	48 89 f0             	mov    %rsi,%rax
  401324:	48 89 c2             	mov    %rax,%rdx
  401327:	48 c1 ea 03          	shr    $0x3,%rdx
  40132b:	48 81 c2 00 80 ff 7f 	add    $0x7fff8000,%rdx
  401332:	0f b6 12             	movzbl (%rdx),%edx
  401335:	84 d2                	test   %dl,%dl
  401337:	41 0f 95 c0          	setne  %r8b
  40133b:	48 89 c7             	mov    %rax,%rdi
  40133e:	83 e7 07             	and    $0x7,%edi
  401341:	83 c7 03             	add    $0x3,%edi
  401344:	40 38 d7             	cmp    %dl,%dil
  401347:	0f 9d c2             	setge  %dl
  40134a:	44 21 c2             	and    %r8d,%edx
  40134d:	84 d2                	test   %dl,%dl
  40134f:	74 08                	je     401359 <_Z5isortiPi+0x143>
  401351:	48 89 c7             	mov    %rax,%rdi
  401354:	e8 07 fd ff ff       	callq  401060 <__asan_report_load4@plt>
  401359:	8b 36                	mov    (%rsi),%esi
  40135b:	48 89 c8             	mov    %rcx,%rax
  40135e:	48 89 c2             	mov    %rax,%rdx
  401361:	48 c1 ea 03          	shr    $0x3,%rdx
  401365:	48 81 c2 00 80 ff 7f 	add    $0x7fff8000,%rdx
  40136c:	0f b6 12             	movzbl (%rdx),%edx
  40136f:	84 d2                	test   %dl,%dl
  401371:	41 0f 95 c0          	setne  %r8b
  401375:	48 89 c7             	mov    %rax,%rdi
  401378:	83 e7 07             	and    $0x7,%edi
  40137b:	83 c7 03             	add    $0x3,%edi
  40137e:	40 38 d7             	cmp    %dl,%dil
  401381:	0f 9d c2             	setge  %dl
  401384:	44 21 c2             	and    %r8d,%edx
  401387:	84 d2                	test   %dl,%dl
  401389:	74 08                	je     401393 <_Z5isortiPi+0x17d>
  40138b:	48 89 c7             	mov    %rax,%rdi
  40138e:	e8 9d fc ff ff       	callq  401030 <__asan_report_store4@plt>
  401393:	89 31                	mov    %esi,(%rcx)
  401395:	83 6d f8 01          	subl   $0x1,-0x8(%rbp)
  401399:	e9 f4 fe ff ff       	jmpq   401292 <_Z5isortiPi+0x7c>
  40139e:	8b 45 f8             	mov    -0x8(%rbp),%eax
  4013a1:	48 98                	cltq   
  4013a3:	48 8d 14 85 00 00 00 	lea    0x0(,%rax,4),%rdx
  4013aa:	00 
  4013ab:	48 8b 45 e0          	mov    -0x20(%rbp),%rax
  4013af:	48 8d 0c 02          	lea    (%rdx,%rax,1),%rcx
  4013b3:	48 89 c8             	mov    %rcx,%rax
  4013b6:	48 89 c2             	mov    %rax,%rdx
  4013b9:	48 c1 ea 03          	shr    $0x3,%rdx
  4013bd:	48 81 c2 00 80 ff 7f 	add    $0x7fff8000,%rdx
  4013c4:	0f b6 12             	movzbl (%rdx),%edx
  4013c7:	84 d2                	test   %dl,%dl
  4013c9:	40 0f 95 c7          	setne  %dil
  4013cd:	48 89 c6             	mov    %rax,%rsi
  4013d0:	83 e6 07             	and    $0x7,%esi
  4013d3:	83 c6 03             	add    $0x3,%esi
  4013d6:	40 38 d6             	cmp    %dl,%sil
  4013d9:	0f 9d c2             	setge  %dl
  4013dc:	21 fa                	and    %edi,%edx
  4013de:	84 d2                	test   %dl,%dl
  4013e0:	74 08                	je     4013ea <_Z5isortiPi+0x1d4>
  4013e2:	48 89 c7             	mov    %rax,%rdi
  4013e5:	e8 46 fc ff ff       	callq  401030 <__asan_report_store4@plt>
  4013ea:	8b 45 fc             	mov    -0x4(%rbp),%eax
  4013ed:	89 01                	mov    %eax,(%rcx)
  4013ef:	83 45 f4 01          	addl   $0x1,-0xc(%rbp)
  4013f3:	e9 34 fe ff ff       	jmpq   40122c <_Z5isortiPi+0x16>
  4013f8:	90                   	nop
  4013f9:	c9                   	leaveq 
  4013fa:	c3                   	retq   
```