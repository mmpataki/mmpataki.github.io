---
tags: jvm jit performance java-agents java
category: Programming
---

So... one day I notice a JVM hanging at the startup in one of our servers. It has not logged anything after it has started. `jstack` showed that the process is executing some `premain` function

### jstack
```
# jstack 24692
...
"main" #1 prio=5 os_prio=0 tid=0x00007f228000a000 nid=0x6075 runnable [0x00007f2287823000]
   java.lang.Thread.State: RUNNABLE
        at sun.security.provider.SHA2.implCompress(SHA2.java:201)
        at sun.security.provider.DigestBase.implCompressMultiBlock(DigestBase.java:141)
        at sun.security.provider.DigestBase.engineUpdate(DigestBase.java:128)
        at java.security.MessageDigest$Delegate.engineUpdate(MessageDigest.java:584)
        at java.security.MessageDigest.update(MessageDigest.java:335)
        at com.sun.crypto.provider.HmacCore.engineUpdate(HmacCore.java:161)
        at javax.crypto.Mac.update(Mac.java:485)
        at com.sun.crypto.provider.PBKDF2KeyImpl.deriveKey(PBKDF2KeyImpl.java:178)
        at com.sun.crypto.provider.PBKDF2KeyImpl.<init>(PBKDF2KeyImpl.java:113)
        at com.sun.crypto.provider.PBKDF2Core.engineGenerateSecret(PBKDF2Core.java:69)
        at javax.crypto.SecretKeyFactory.generateSecret(SecretKeyFactory.java:336)
        at com.mmp.jvmtiperf.MyAgent.decrypt(MyAgent.java:17)
        at com.mmp.jvmtiperf.MyAgent.premain(MyAgent.java:28)
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:498)
        at sun.instrument.InstrumentationImpl.loadClassAndStartAgent(InstrumentationImpl.java:386)
        at sun.instrument.InstrumentationImpl.loadClassAndCallPremain(InstrumentationImpl.java:401)
```

I also profiled the JVM, and this was the most common stack

```
--- 10001689 ns (0.04%), 1 sample
  [ 0] sun.misc.Unsafe.getInt
  [ 1] sun.security.provider.ByteArrayAccess.b2iBig64
  [ 2] sun.security.provider.SHA2.implCompress
  [ 3] sun.security.provider.SHA2.implDigest
  [ 4] sun.security.provider.DigestBase.engineDigest
  [ 5] sun.security.provider.DigestBase.engineDigest
  [ 6] java.security.MessageDigest$Delegate.engineDigest
  [ 7] java.security.MessageDigest.digest
  [ 8] com.sun.crypto.provider.HmacCore.engineDoFinal
  [ 9] javax.crypto.Mac.doFinal
  [10] javax.crypto.Mac.doFinal
  [11] com.sun.crypto.provider.PBKDF2KeyImpl.deriveKey
  [12] com.sun.crypto.provider.PBKDF2KeyImpl.<init>
  [13] com.sun.crypto.provider.PBKDF2Core.engineGenerateSecret
  [14] javax.crypto.SecretKeyFactory.generateSecret
  [15] com.mmp.jvmtiperf.MyAgent.decrypt
  [16] com.mmp.jvmtiperf.MyAgent.premain
  [17] sun.reflect.NativeMethodAccessorImpl.invoke0
  [18] sun.reflect.NativeMethodAccessorImpl.invoke
  [19] sun.reflect.DelegatingMethodAccessorImpl.invoke
  [20] java.lang.reflect.Method.invoke
  [21] sun.instrument.InstrumentationImpl.loadClassAndStartAgent
  [22] sun.instrument.InstrumentationImpl.loadClassAndCallPremain

          ns  percent  samples  top
  ----------  -------  -------  ---
 13747492952   52.44%     1374  sun.security.provider.SHA2.lf_S
  1920993571    7.33%      192  sun.security.provider.SHA2.implCompress
  1801015904    6.87%      180  sun.security.provider.SHA2.lf_R
  1190642160    4.54%      119  sun.security.provider.SHA2.lf_maj
  1160569433    4.43%      116  sun.security.provider.SHA2.lf_ch
  1040701461    3.97%      104  Interpreter
  1010585056    3.86%      101  sun.security.provider.SHA2.lf_sigma0
   560312244    2.14%       56  sun.security.provider.SHA2.lf_sigma1
   560302440    2.14%       56  sun.security.provider.SHA2.lf_delta1
   560296929    2.14%       56  sun.security.provider.SHA2.lf_delta0
   300184334    1.15%       30  java.lang.Integer.reverseBytes
   170088977    0.65%       17  java.util.Arrays.fill
   160085552    0.61%       16  sun.security.provider.DigestBase.engineUpdate
   150083336    0.57%       15  sun.security.provider.ByteArrayAccess.b2iBig64
```

Agents are common in Java world and premain is a function implemented by a java agent. So I checked the agent attached to this JVM. It was a silly little code, which used to compute some secret and set it as a JVM argument. Since I can't share the complete code here, I extracted a MVCE out of it which is given below

```java
$ cat MyAgent.java
package com.mmp.jvmtiperf;

import javax.crypto.spec.*;
import java.lang.instrument.Instrumentation;
import java.security.spec.*;
import java.util.Base64;
import javax.crypto.*;

public class MyAgent {

    public static String decrypt(String strToDecrypt, String secret) {
        try {
            byte[] iv = new byte[16];
            IvParameterSpec ivspec = new IvParameterSpec(iv);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(secret.toCharArray(), "hello@123".getBytes(), 65536, 256);
            SecretKey tmp = factory.generateSecret(spec);
            SecretKeySpec secretKey = new SecretKeySpec(tmp.getEncoded(), "AES");
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING");
            cipher.init(2, secretKey, ivspec);
            return new String(cipher.doFinal(Base64.getDecoder().decode(strToDecrypt)));
        } catch (Exception e) {
            return null;
        }
    }

    public static void premain(String agentArgs, Instrumentation inst) {
        System.setProperty("mySecretProp",
           decrypt("89/LaUAGfN8VMrUew8wuylMyzgcCxC6Af4DVLROEouw=", "supersecret"));
    }
}
```

To compile and package this, run the below commands

```bash
$ javac MyAgent.java
$ mkdir -p com/mmp/jvmtiperf
$ cp MyAgent.class com/mmp/jvmtiperf
$ mkdir META-INF
$ echo "Manifest-Version: 1.0
Implementation-Title:   myagent
Premain-Class: com.mmp.jvmtiperf.MyAgent
Implementation-Version: 1.0.0" > META-INF/MANIFEST.MF
$ jar cvf myagent.jar com/mmp/jvmtiperf
$ zip myagent.jar META-INF/MANIFEST.MF
```

Now to run this, we need a test program

```java
$ cat test.java
class test {
        public static void main(String a[]) {
                if(a.length > 0 && a[0].equals("-runPremain"))
                        com.mmp.jvmtiperf.MyAgent.premain(a[0], null);
                System.out.println("exitting");
        }
}
```

Just running this code (using the below command) runs real quick

```bash
$ javac test.java
$ time java  -cp . test -runPremain
exitting

real    0m0.629s
user    0m1.282s
sys     0m0.083s
```

This is confusing, because the app used to spend most of its time here in the agent. Only difference here is the code is executed from the `main`, while in our hung application, it was called from `premain`, so we need to test it in the same way.

```
$ time java -javaagent:myagent.jar -cp . test
exitting

real    0m32.057s
user    0m32.020s
sys     0m0.054s
```

Ok, we were able to reproduce the issue, but why the function called from `premain` was slower than the function called from the `main`? Let's profile this fast JVM to understand this

```
$ java -cp . -agentpath:/root/perf/async-profiler-master/build/libasyncProfiler.so=start,file=foo test -runPremain
$ cat perf
....
          ns  percent  samples  top
  ----------  -------  -------  ---
   140071867   23.33%       14  sun.security.provider.SHA2.implCompress
   110105345   18.34%       11  Method::make_jmethod_id(ClassLoaderData*, Method*)
    20016638    3.33%        2  Rewriter::scan_method(Method*, bool, bool*)
    20009898    3.33%        2  __malloc
    19997059    3.33%        2  sun.security.provider.SHA.implCompress
    10022555    1.67%        1  _raw_spin_unlock_irqrestore_[k]
    10016146    1.67%        1  __do_page_fault_[k]
    10011639    1.67%        1  __GI___pthread_mutex_lock
    10011504    1.67%        1  java_lang_String::equals(oopDesc*, unsigned short*, int)
    10011372    1.67%        1  Interpreter
    10009534    1.67%        1  java.io.ByteArrayInputStream.available
    10009404    1.67%        1  __pthread_getspecific
```

If we compare the profile results, the JVM's Interpreter is executed more times in slow JVM than the faster one 

#### Slower one
```
1160569433    4.43%      116  sun.security.provider.SHA2.lf_ch
1040701461    3.97%      104  Interpreter
1010585056    3.86%      101  sun.security.provider.SHA2.lf_sigma0
```

#### Faster one
```
10011504    1.67%        1  java_lang_String::equals(oopDesc*, unsigned short*, int)
10011372    1.67%        1  Interpreter
10009534    1.67%        1  java.io.ByteArrayInputStream.available
```

So, something related to the bytecode interpreter is wrong (104 is the number of times it appered on the stack). So, let's see what is going on inside the JVM. Let's use 

Compilation in fast JVM (Refer the images at the end to see all the compiled packages.)

```
$ java -XX:+UnlockDiagnosticVMOptions -XX:+PrintCompilation  -cp . test -runPremain | grep 'sun.security.provider.SHA2.'
    ...
    192  206       3       sun.security.provider.SHA2::lf_S (11 bytes)
    193  207       3       sun.security.provider.SHA2::lf_R (4 bytes)
    193  209       3       sun.security.provider.SHA2::lf_sigma1 (21 bytes)
    193  210       3       sun.security.provider.SHA2::lf_ch (10 bytes)
    193  211       3       sun.security.provider.SHA2::lf_sigma0 (20 bytes)
    ...
```

Compilation in fast JVM (Nothing from sun.security was compiled)

```
$ java -XX:+UnlockDiagnosticVMOptions -XX:+PrintCompilation -javaagent:myagent.jar -cp . test   | grep 'sun.security.provider.SHA2::lf_S'
$
```

So, it was the JIT compiler who was not compiling the crypto packages and letting them run on the Interpreter. Solution? I still need to find it :P

## Images

### (Snapshot from JITWatch for fast JVM)

### (Snapshot from JITWatch for slow JVM)


