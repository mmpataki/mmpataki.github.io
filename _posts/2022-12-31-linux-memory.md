---
title: Linux memory notes
tags: programming linux memory
category: Programming
---

Read these shorts (tests) to understand how the memory allocation works in Linux.

## Test 1

### Flush the system buffers
```bash
$ echo 3 > /proc/sys/vm/drop_caches
```

### Before allocation
```bash
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821         693        6985           7         141        6919
Swap:          5119        2916        2203
```

### Just allocate and don't consume
```c
#include<stdlib.h>
int main(int argc, char **argv) {
        long i, sz = atol(argv[1]) * (1024l * 1024l);
        char *buf = malloc(sz);
        printf("%p", buf);
        scanf("%c", &argc);
}
```

### When program is running
```bash
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821         703        6956           7         160        6899
Swap:          5119        2907        2212
```

### If I run multiple instances of this program 
```bash
$ gcc holderv1.c
$ ./a.out 8192
0x7f4c179cf010^X^Z
[1]+  Stopped                 ./a.out 8192
$ ./a.out 8192
0x7f96d0301010^Z
[2]+  Stopped                 ./a.out 8192
$ ./a.out 8192
0x7f0a8acd0010^Z
[3]+  Stopped                 ./a.out 8192
```

### Conclusion
Nothing happens, program runs fine. Looks like Linux is not actually reserving memory unless we write to it.

<br/>
## Test 2
Here is the second version of the program

```c
#include<stdlib.h>
int main(int argc, char **argv) {
        long i, sz = atol(argv[1]) * (1024l * 1024l);
        char *buf = malloc(sz);
        printf("%p", buf);
        for(i = 0; i < sz; i += 4096)
                buf[i] = 'a';
        scanf("%c", &argc);
}
```

### Before running the program
```bash
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821         713        6996           7         111        6914
Swap:          5119        2890        2229
```

### While running the program
```bash
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821        7583         145           2          92          56
Swap:          5119        4222         897
```

### Run another version of the v2 program
It crashes (because memory allocation failed, so write to memory fails)
```bash
$ ./a.out 8192
0x7fead8e02010^Z
[1]+  Stopped                 ./a.out 8192
$ ./a.out 8192
Segmentation fault (core dumped)
```

### Now let's run the v1 of the program when v2 is already running
Now linux didn't allocate the memory.
```bash
$ gcc holderv1.c
$ ./a.out 8192
(nil)
```

### Conclusion
Linux does kind of a overcommitting the memory. It doesn't immediately reserve the pages for you, but it does when you write to it. This behavior of overcommitting can be controlled. Read test 3

<br/>
## Test 3

Controlling this behavior is quite easy and we have three options (heuristic[0, default], always_overcommit [1], don't_overcommit [2]). Read more about this in `man proc 5`. 

### Test 3.0 (heuristic)
- already tested above

### Test 3.1 (always_overcommit)

### Set the mode
```bash
$ echo 1 > /proc/sys/vm/overcommit_memory
$ cat /proc/sys/vm/overcommit_memory
1
```

### Before running the program
```bash
$ echo 3 > /proc/sys/vm/drop_caches
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821         706        6996           8         118        6917
Swap:          5119        2911        2208
```

### Run 2 instances of the v2 of the program
```bash
$ ./a.out 8192
^Z
[1]+  Stopped                 ./a.out 8192
$ ./a.out 8192
Killed
```

### Killed? why?
```bash
$ tail -n 200 /var/log/messages
Dec 31 13:46:46 mmp.com kernel: EcNet-dns invoked oom-killer: gfp_mask=0x201da, order=0, oom_score_adj=0
Dec 31 13:46:46 mmp.com kernel: EcNet-dns cpuset=/ mems_allowed=0
Dec 31 13:46:46 mmp.com kernel: CPU: 0 PID: 2390 Comm: EcNet-dns Kdump: loaded Tainted: G           OE  ------------   3.10.0-1160.45.1.el7.x86_64 #1
Dec 31 13:46:46 mmp.com kernel: Hardware name: VMware, Inc. VMware Virtual Platform/440BX Desktop Reference Platform, BIOS 6.00 11/12/2020
Dec 31 13:46:46 mmp.com kernel: Call Trace:
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b983539>] dump_stack+0x19/0x1b
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b97e5d8>] dump_header+0x90/0x229
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b306992>] ? ktime_get_ts64+0x52/0xf0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b35e01f>] ? delayacct_end+0x8f/0xb0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3c254d>] oom_kill_process+0x2cd/0x490
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3c1f3d>] ? oom_unkillable_task+0xcd/0x120
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3c2c3a>] out_of_memory+0x31a/0x500
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3c9854>] __alloc_pages_nodemask+0xad4/0xbe0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b4193b8>] alloc_pages_current+0x98/0x110
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3be007>] __page_cache_alloc+0x97/0xb0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3c0fa0>] filemap_fault+0x270/0x420
Dec 31 13:46:46 mmp.com kernel: [<ffffffffc067591e>] __xfs_filemap_fault+0x7e/0x1d0 [xfs]
Dec 31 13:46:46 mmp.com kernel: [<ffffffffc0675b1c>] xfs_filemap_fault+0x2c/0x30 [xfs]
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3ee7aa>] __do_fault.isra.61+0x8a/0x100
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3eed5c>] do_read_fault.isra.63+0x4c/0x1b0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b3f65a0>] handle_mm_fault+0xa20/0xfb0
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b990653>] __do_page_fault+0x213/0x500
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b990975>] do_page_fault+0x35/0x90
Dec 31 13:46:46 mmp.com kernel: [<ffffffff8b98c778>] page_fault+0x28/0x30
Dec 31 13:46:46 mmp.com kernel: Mem-Info:
Dec 31 13:46:46 mmp.com kernel: active_anon:1573603 inactive_anon:308826 isolated_anon:32#012 active_file:59 inactive_file:0 isolated_file:0#012 unevictable:0 dirty:0 writeback:22 unstable:0#012 slab_reclaimable:12390 slab_unreclaimable:13997#012 mapped:8271 shmem:186 pagetables:18939 bounce:0#012 free:25783 free_pcp:0 free_cma:0
Dec 31 13:46:46 mmp.com kernel: Node 0 DMA free:15900kB min:132kB low:164kB high:196kB active_anon:0kB inactive_anon:0kB active_file:0kB inactive_file:0kB unevictable:0kB isolated(anon):0kB isolated(file):0kB present:15992kB managed:15908kB mlocked:0kB dirty:0kB writeback:0kB mapped:0kB shmem:0kB slab_reclaimable:0kB slab_unreclaimable:8kB kernel_stack:0kB pagetables:0kB unstable:0kB bounce:0kB free_pcp:0kB local_pcp:0kB free_cma:0kB writeback_tmp:0kB pages_scanned:0 all_unreclaimable? yes
Dec 31 13:46:46 mmp.com kernel: lowmem_reserve[]: 0 2830 7802 7802
Dec 31 13:46:46 mmp.com kernel: Node 0 DMA32 free:44284kB min:24460kB low:30572kB high:36688kB active_anon:2201032kB inactive_anon:553404kB active_file:184kB inactive_file:56kB unevictable:0kB isolated(anon):0kB isolated(file):0kB present:3129216kB managed:2898784kB mlocked:0kB dirty:0kB writeback:0kB mapped:12012kB shmem:736kB slab_reclaimable:20372kB slab_unreclaimable:14696kB kernel_stack:5872kB pagetables:22668kB unstable:0kB bounce:0kB free_pcp:0kB local_pcp:0kB free_cma:0kB writeback_tmp:0kB pages_scanned:997 all_unreclaimable? yes
Dec 31 13:46:46 mmp.com kernel: lowmem_reserve[]: 0 0 4972 4972
Dec 31 13:46:46 mmp.com kernel: Node 0 Normal free:42948kB min:42988kB low:53732kB high:64480kB active_anon:4093380kB inactive_anon:681900kB active_file:52kB inactive_file:0kB unevictable:0kB isolated(anon):128kB isolated(file):0kB present:5242880kB managed:5094280kB mlocked:0kB dirty:0kB writeback:88kB mapped:21072kB shmem:8kB slab_reclaimable:29188kB slab_unreclaimable:41284kB kernel_stack:8288kB pagetables:53088kB unstable:0kB bounce:0kB free_pcp:0kB local_pcp:0kB free_cma:0kB writeback_tmp:0kB pages_scanned:208 all_unreclaimable? yes
Dec 31 13:46:46 mmp.com kernel: lowmem_reserve[]: 0 0 0 0
Dec 31 13:46:46 mmp.com kernel: Node 0 DMA: 1*4kB (U) 1*8kB (U) 1*16kB (U) 0*32kB 2*64kB (U) 1*128kB (U) 1*256kB (U) 0*512kB 1*1024kB (U) 1*2048kB (M) 3*4096kB (M) = 15900kB
Dec 31 13:46:46 mmp.com kernel: Node 0 DMA32: 404*4kB (UEM) 841*8kB (UEM) 524*16kB (UEM) 95*32kB (UE) 67*64kB (UEM) 34*128kB (UEM) 17*256kB (UEM) 7*512kB (UEM) 6*1024kB (M) 1*2048kB (U) 0*4096kB = 44536kB
Dec 31 13:46:46 mmp.com kernel: Node 0 Normal: 453*4kB (UEM) 784*8kB (UEM) 735*16kB (UEM) 146*32kB (UEM) 99*64kB (UE) 29*128kB (UEM) 4*256kB (U) 3*512kB (UM) 6*1024kB (M) 0*2048kB 0*4096kB = 43268kB
Dec 31 13:46:46 mmp.com kernel: Node 0 hugepages_total=0 hugepages_free=0 hugepages_surp=0 hugepages_size=1048576kB
Dec 31 13:46:46 mmp.com kernel: Node 0 hugepages_total=0 hugepages_free=0 hugepages_surp=0 hugepages_size=2048kB
Dec 31 13:46:46 mmp.com kernel: 71419 total pagecache pages
Dec 31 13:46:46 mmp.com kernel: 71077 pages in swap cache
Dec 31 13:46:46 mmp.com kernel: Swap cache stats: add 5866812, delete 5795368, find 23434233/23723035
Dec 31 13:46:46 mmp.com kernel: Free swap  = 0kB
Dec 31 13:46:46 mmp.com kernel: Total swap = 5242876kB
Dec 31 13:46:46 mmp.com kernel: 2097022 pages RAM
Dec 31 13:46:46 mmp.com kernel: 0 pages HighMem/MovableOnly
Dec 31 13:46:46 mmp.com kernel: 94779 pages reserved
Dec 31 13:46:46 mmp.com kernel: [ pid ]   uid  tgid total_vm      rss nr_ptes swapents oom_score_adj name
...
Dec 31 13:46:46 mmp.com kernel: [28780]     0 28780  2098207   203274    1305   460992             0 a.out
Dec 31 13:46:46 mmp.com kernel: [28792]     0 28792  2098207  1593870    3169    24579             0 a.out
Dec 31 13:46:46 mmp.com kernel: Out of memory: Kill process 28792 (a.out) score 474 or sacrifice child
Dec 31 13:46:46 mmp.com kernel: Killed process 28792 (a.out), UID 0, total-vm:8392828kB, anon-rss:6375476kB, file-rss:4kB, shmem-rss:0kB
```

### Conclusion
Always overcommit mode allows the program to ask more memory than available but it invokes oom killer when there is no memory left in the system

## Test 3.2 (don't_overcommit)
### Setup
```bash
$ echo 2 > /proc/sys/vm/overcommit_memory
$ cat /proc/sys/vm/overcommit_memory
2
```

### Before running the program
```bash
$ echo 3 > /proc/sys/vm/drop_caches
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           7821         701        7012           4         107        6930
Swap:          5119        2148        2971
```

### Single instance of the program fails
```bash
$ ./a.out 8192
Segmentation fault (core dumped)
```
