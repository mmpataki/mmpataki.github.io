---
layout: post
title:  "Building Hbase 1.3.1 with JDK 8"
date:   2020-07-02 11:14:07 +0530
tags: hbase build jdk8 
category: programming
---

HBase is a opensource NoSQL store built on top of Hadoop HDFS filesystem. Read more about it [here](https://hbase.apache.org/)

Building HBase 1.3.1 with JDK 8 will bring out some new problems (Well there are some other issues as well). This blog post is to help people who are walking on the same way as I am.

### Assumptions

1. You have installed JDK 8
2. HBase uses maven for builds, you should have installed maven.
3. The sources are already downloaded and are present in /home/xyz/hbase

### `mvn install` won't work?
No, you will hit some compilation issues and some shell script failures.

**Compilation error**
> \[ERROR\] Failed to execute goal org.codehaus.mojo:findbugs-maven-plugin:3.0.0:findbugs (default) on project hbase: Unable to parse configuration of mojo org.codehaus.mojo:findbugs-maven-plugin:3.0.0:findbugs for parameter pluginArtifacts: Cannot assign configuration entry 'pluginArtifacts' with value '${plugin.artifacts}' of type java.util.Collections.UnmodifiableRandomAccessList to property of type java.util.ArrayList -> \[Help 1\]

**Shell script failure**
> \[ERROR\] Failed to execute goal org.codehaus.mojo:exec-maven-plugin:1.4.0:exec (concat-NOTICE-files) on project hbase-assembly: Command execution failed.: Process exited with an error: 1 (Exit value: 1) -> \[Help 1\]  
> org.apache.maven.lifecycle.LifecycleExecutionException: Failed to execute goal org.codehaus.mojo:exec-maven-plugin:1.4.0:exec (concat-NOTICE-files) on project hbase-assembly: Command execution failed.


### Ok how do I solve them?
1. Edit the file /home/xyz/hbase/pom.xml and make the following changes.

	**Before**
	```xml
	...
	<plugin>  
	  <groupId>org.codehaus.mojo</groupId>  
	  <artifactId>findbugs-maven-plugin</artifactId>  
	  <version>**3.0.0**</version>  
	  <!--NOTE: Findbugs 3.0.0 requires jdk7-->
	...
	```
	**After**
	```xml
	...
	<plugin>  
	  <groupId>org.codehaus.mojo</groupId>  
	  <artifactId>findbugs-maven-plugin</artifactId>  
	  <version>**3.0.4**</version>  
	  <!--NOTE: Findbugs 3.0.0 requires jdk7-->
	...
	```

2. Edit the file /home/xyz/hbase/hbase-assembly/pom.xml and make the following changes. New versions of bash seems to not accept the extra line at the end  

	**Before**
	```xml
	...
	    <argument>bash</argument>
	    <argument>-c</argument>
	    <argument>cat maven-shared-archive-resources/META-INF/NOTICE \\
		\`find ${project.build.directory}/dependency -iname NOTICE -or -iname NOTICE.txt\` \\  
	    </argument>
	....
	```
	**After**
	```xml
	...
	    <argument>bash</argument>  
	    <argument>-c</argument>  
	    <argument>cat maven-shared-archive-resources/META-INF/NOTICE \\  
		\`find ${project.build.directory}/dependency -iname NOTICE -or -iname NOTICE.txt\`  
	    </argument>  
	...
	```
