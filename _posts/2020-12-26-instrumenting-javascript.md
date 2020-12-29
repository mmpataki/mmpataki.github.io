---
tags: javascript hack
category: Programming
---

Today I was trying to write a user action recorder for a website of mine. Most of the coding was just adding a bunch of lines to beginning and end of each javascript function so I asked my brother to do it. He is an amateur so he was kind of copy pasting the same code everywhere.

I thought I could help him to do this using javascript prototypes. I had heard of them but never tried them earlier. So I started with a simple example (Try clicking buttons in below app)

<script async src="//jsfiddle.net/qjvgtxem/1/embed/result,js,html,css"></script>

Now I had like 30 functions in my class which I wanted to trace and copying the recording code into each function will bloat up the script file and makes it unmanagable.

So here is a generic solution I came up with. Basically this function adds 3 more methods (you provide 2 of them) per given method in to your class. One executes before the actual code, one executes after your code and one calls the other two.

```javascript
function instrument(klass, arr, pre, post) {
    arr.forEach(func => {

        let nfunc = `__${func}__instrumented`;
        let pre_f = `__pre__${func}__instrumented`;
        let post_f = `__post__${func}__instrumented`;

        klass.prototype[pre_f] = pre
        klass.prototype[nfunc] = klass.prototype[func]
        klass.prototype[post_f] = post

        klass.prototype[func] = function () {
            this[pre_f] && this[pre_f](func, arguments);
            this[nfunc](...arguments);
            this[post_f] && this[post_f](func, arguments);
        }
    });
}
```

Using this instrumentation function one can inject custom code into any [global] function of a class. Here is the usage

```javascript
instrument(
    ClassName, 
    ['function_1', 'function_2' ...],
    function_to_call_at_entry,
    function_to_call_at_exit
);
```

Here is the complete code which uses this `instrument` function.

<script async src="//jsfiddle.net/ze61m57n/embed/js,result,html,css"></script>

Although the code looks huge, you would see the benifits once the number of functions to be instrumented crosses 3-4.

