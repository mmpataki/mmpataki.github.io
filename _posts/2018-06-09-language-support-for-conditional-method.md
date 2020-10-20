---
title: Language support for conditional method
tags: java language feature
category: Programming
---

While going through the Hadoop HDFS code, I saw three lines of code repeated everywhere when a debug statement must printed (see below).  

```java
if (DFSClient.LOG.isDebugEnabled()) {  
	DFSClient.LOG.debug("...");  
}
```

Well everything is correct in this code. But when you start to see this first line repeating everywhere in the code it gets really annoying. There is a workaround but it has some cost. Let's see it.  
  
### Workaround 1.  
Create a Logger class which has log level set. And checks whether it should emit the log to output stream.  

```java
class Logger {  
	public static final int DEBUG = 0;  
	public static final int LOW = 1;  
	public static final int MEDIUM = 2;  
	public static final int HIGH = 3;  

	private int level;  
	private PrintStream strm;  

	public Logger(PrintStream strm, int level) {  
		this.level = level;  
		this.strm = strm;  
	}  

	public void debug(String s) {  
		if(level <= DEBUG)  
			strm.println(s);  
	}  
}
```
  
To use this.  
```java
Logger LOG = new Logger(strm, Logger.DEBUG);  
LOG.debug("Hello world!");  
```
  
But this is going to affect the performance as the evaluation of the arguments happen before the level value is checked. If someone does a computation for printing then it would be wasted if log level is not set. Instead I propose a language support for this condition check before making a function call and evaluation of the arguments.  
  
For language such as Java I propose a keyword preval which can used to mark the argument (must be boolean). Only this argument must be evaluated before doing the further argument processing. So the debug code may look something like.  
  
```java
public void debug(String s, preval boolean shouldPrint) {  
	strm.println(s);  
} 
```
  
And should be used as  
```java
DFSClient.LOG.debug("...", DFSClient.LOG.isDebugEnabled());  
```
  
Well this is also annoying as you have to pass this boolean argument everytime you make call to debug. There is further room for improvement for languages which support methods with default arguments (with evaluation). Then the debug method could be written as  

```java
public void debug(String s, preval boolean shouldPrint=(this.level<=DEBUG)) {  
	strm.println(s);  
}
```
  
To use this method we can either pass the argument explicitly or write  
```java
DFSClient.LOG.debug("...");  
```

This makes the code really crisp and cute (without those annoying if checks everywhere). If any Java language developer ever see this blogpost please try to implement this. (I couldn't find any place to suggest modifications to Java language)

