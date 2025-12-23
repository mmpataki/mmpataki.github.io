---
title: Java ArrayList vs LinkedList
tags: programming java lists datastructures
category: programming
---

The Java `ArrayList` is one of commonly used datastructure. But there can be situations where this can seriously affect your application performance. 

So one day we were looking at the code like below was performing slow

```java
public void filterObjects(ArrayList<SomeObject> list) {
    Iterator<SomeObject> it = list.iterator();
    while(it.hasNext()) {
        if(some_condition(it.next()))
            it.remove();
    }
}
```

Surprisingly, this simple loop was terribly slow. (In our case it ran for `~4 hrs`). We found that its due to `ArrayList.remove` by doing `jstack` based profiling.

Now let's see how `LinkedList` performs in this case. Below is a simple benchmark

```java
import java.util.*;
class remove_test {
        public static void main(String args[]) {

                List<String> list = args[0].equals("array") ? new ArrayList<>() : new LinkedList<>();

                for(int i = 0; i < Integer.parseInt(args[1]); i++)
                        list.add("foo");

                Iterator<String> it = list.iterator();
                while(it.hasNext()) {
                        it.next();
                        it.remove();
                }
        }
}
```

Here are the runs

### ArrayList
```bash
$ time java remove_test array 500000

real    0m34.329s
user    0m33.891s
sys     0m0.328s
```

### LinkedList
```bash
$ time java remove_test linked 500000

real    0m0.214s
user    0m0.203s
sys     0m0.109s
```

The slowness comes from the way the `ArrayList` stores the elements. It uses a array to store them and remove on a `ArrayList` causes a `memcopy` (to shift the elements to the left) which is costly.

But random access on the `ArrayList` is faster compared to `LinkedList` Here are the comparisons

### Test
```java
import java.util.*;
class access_test {
        public static void main(String args[]) {

                int limit = Integer.parseInt(args[1]);
                List<String> a = args[0].equals("array") ? new ArrayList<>() : new LinkedList<>();

                for(int i = 0; i < limit; i++) {
                        a.add("foo");
                }

                for(int i = 0; i < limit; i++) {
                        a.get(i);
                }
        }
}
```

### ArrayList
This speed is coming from the way elements are stored.
```
$ time java access_test array 100000

real    0m0.416s
user    0m0.141s
sys     0m0.234s
```

### LinkedList
```
$ time java access_test linked 100000

real    0m16.239s
user    0m14.781s
sys     0m0.344s
```

### Conclusion
1. Use `ArrayList` when random access and less `delete`s are needed
2. Usee `LinkedList` when iteration based access and remove is required.
