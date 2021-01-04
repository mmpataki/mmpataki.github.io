---
tags: gdb hack
title: Hung sockets, Huh?
category: Programming
---

So... you have a process hung on doing some socket operation (which you don't want it to do?)

__As always here is the story__  

I was trying to debug a hanging `python` command. `pstack` said it was connecting somewhere.
```bash
# pstack 24372
#0  0x00007f3ea2964c10 in __poll_nocancel () from /lib64/libc.so.6
#1  0x00007f3e98717b3c in internal_select_ex.isra.0 () from /usr/lib64/python2.7/lib-dynload/_socketmodule.so
#2  0x00007f3e987183c4 in internal_connect () from /usr/lib64/python2.7/lib-dynload/_socketmodule.so
#3  0x00007f3e9871aff8 in sock_connect () from /usr/lib64/python2.7/lib-dynload/_socketmodule.so
#4  0x00007f3ea364981a in PyEval_EvalFrameEx () from /lib64/libpython2.7.so.1.0
#5  0x00007f3ea364b64d in PyEval_EvalCodeEx () from /lib64/libpython2.7.so.1.0
#6  0x00007f3ea35d4f88 in function_call () from /lib64/libpython2.7.so.1.0
#7  0x00007f3ea35b0073 in PyObject_Call () from /lib64/libpython2.7.so.1.0
#8  0x00007f3e98b3f8e1 in partial_call () from /usr/lib64/python2.7/lib-dynload/_functoolsmodule.so
#9  0x00007f3ea35b0073 in PyObject_Call () from /lib64/libpython2.7.so.1.0
#10 0x00007f3ea3644846 in PyEval_EvalFrameEx () from /lib64/libpython2.7.so.1.0
#11 0x00007f3ea364b64d in PyEval_EvalCodeEx () from /lib64/libpython2.7.so.1.0
```

Where was it connecting to?
```bash
# lsof -p 24372
...
python  24372 root    4w   REG              253,0    343936 201366877 /var/log/rhsm/rhsm.log
python  24372 root    5u  IPv4          222394982       0t0       TCP xyz.abc.mno:46640->subscription.rhsm.redhat.com:https (SYN_SENT)
...
```

So it was redhat subscription website. Since internet access was not provided to the box, the proecss was hanging on TCP socket creation (`SYN_SENT` state)

I never wanted this `python` process to communicate with redhat website. But somehow it was (Actually the culprit was the `yum` configuration which enabled a subscription plugin)

Now I disabled the plugin (settings are in `/etc/yum/pluginconf.d/subscription-manager.conf)` but I didn't want to restart the process. It could have wasted more time. Is there a way I can interrupt the thread/task?

`kill -13` / `kill -2` didn't help. So I went for a `gdb` approach. Since I already knew the `fd` of the socket (check the `lsof` output above) it's only matter of calling `close` system call.

```
# gdb -p 24372
...
Missing separate debuginfos, use: debuginfo-install python-2.7.5-86.el7.x86_64
(gdb) info threads
  Id   Target Id         Frame
* 1    Thread 0x7f57a239b740 (LWP 24372) "python" 0x00007f57a11c9c10 in __poll_nocancel () from /lib64/libc.so.6
(gdb) t 1
[Switching to thread 1 (Thread 0x7f57a239b740 (LWP 24372))]
#0  0x00007f57a11c9c10 in __poll_nocancel () from /lib64/libc.so.6
(gdb) call close(5)
$1 = 0
(gdb) quit
A debugging session is active.
...
```

That was it! socket was closed and process continued (it was trying different alternatives.)

