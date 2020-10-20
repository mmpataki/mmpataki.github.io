---
tags: endianness c hack
category: Programming
---

Have you ever thought which type of memory architecture (Little Endian or Big Endian) your machine has. Can you write a program to find this?  
  
I recommend you to first try this minimizing the browser....  
  
Tired up pulling your hairs off....  
Here is the solution  
  
```c
#include<stdio.h>  
int main(void)   
{  
    int h = 1;  
    char* chptr = (char*)&h;  
    if(*(chptr + 1) == 0)  
        printf("Little-Endian Machine.");  
    else  
        printf("Big-Endian Machine.");  
    getchar();  
    return 0;  
}
```
