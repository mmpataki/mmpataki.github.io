---
tags: javascript hack
category: Programming
---

Today I was trying to write a user action recorder for a website of mine. Most of the coding was just adding a bunch of lines to beginning and end of each javascript function. I asked my brother to do it. He is an ameteur so he was kind of copy pasting the same code everywhere.

I thought I could help him to do this using javascript prototypes. I had heard of them but never tried them earlier. So I started with a simple example

```html
<html>
    Letters:
    <button onclick='e.letter(this.innerText)'>A</button>
    <button onclick='e.letter(this.innerText)'>B</button>
    <button onclick='e.letter(this.innerText)'>C</button>
    <br/>
    Text: 
    <button onclick="e.word(this.innerText)">Apple</button>
    <button onclick="e.word(this.innerText)">Ball</button>
    <button onclick="e.word(this.innerText)">Bag</button>
    <button onclick="e.word(this.innerText)">Cap</button>
    <br/>
    <button onclick="e.publish()">Publish</button>
    <script>
        class Example {
            captur = [];
            capturing = true;
            letter(letter) {
                this.capturing && this.captur.push({ type: 'letter', args: arguments });
                document.body.innerHTML += `<br/>${letter}`;
            }
            word(word) {
                this.capturing && this.captur.push({ type: 'word', args: arguments });
                document.body.innerHTML += `<br/><b>${word}</b>`;
            }
            publish() { 
                document.body.innerHTML +=
                    `<pre>data = ${JSON.stringify(this.captur, null, 2)}</pre>`; 
            }
        }
        let e;
        window.onload = () => e = new Example();
    </script>
</html>
```

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

Here is the complete code after the I use the `instrument` function.

```html
<html>
    Letters:
    <button onclick='e.letter(this.innerText)'>A</button>
    <button onclick='e.letter(this.innerText)'>B</button>
    <button onclick='e.letter(this.innerText)'>C</button>
    <br/>
    Text: 
    <button onclick="e.word(this.innerText)">Apple</button>
    <button onclick="e.word(this.innerText)">Ball</button>
    <button onclick="e.word(this.innerText)">Bag</button>
    <button onclick="e.word(this.innerText)">Cap</button>
    <br/>
    <button onclick="e.publish()">Publish</button>
    <script>
        class Example {
            captur = [];
            capturing = true;
            letter(letter) {
                document.body.innerHTML += `<br/>${letter}`;
            }
            word(word) {
                document.body.innerHTML += `<br/><b>${word}</b>`;
            }
            publish() { 
                document.body.innerHTML +=
                    `<pre>data = ${JSON.stringify(this.captur, null, 2)}</pre>`; 
            }
        }
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

        instrument(Example, ['letter', 'word'], function (name, args) {
            if (this.capturing) {
                this.captur.push({ type: name, args: args })
            }
        });
        let e;
        window.onload = () => e = new Example();
    </script>
</html>
```

Although the code looks huge, you would see the benifits once the number of functions to be instrumented crosses 3-4.

