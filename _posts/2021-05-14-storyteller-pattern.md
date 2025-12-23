---
title: Storyteller pattern
tags: programming pattern storyteller
category: programming
---

This pattern is UI design pattern useful for consuming user inputs (form filling) when type of inputs consumed are depend on other inputs. Here is an example.

You want to build a UI for a service which authenticates user through multiple available ways after few initial inputs like name and age are taken. Once authentication is done, input to the service are consumed and service is provided.

It's tempting to implement a single form with hiding and showing elements whenever required. But think of the ease with which you will build it. Think of how easy it will be to implement validation. This is exactly the pain storyteller pattern tries to solve.

## Why am I calling it `storyteller`?

Each input form is sort of a story which may lead to further stories sharing context between them. These are independent of each other but at the same time be dependant too. A common framework (`storyteller`) takes user through these stories collecting information required.

## A working demo
<p class="codepen" data-height="347" data-theme-id="light" data-default-tab="result" data-user="mmpataki" data-slug-hash="NWprKWd" style="height: 347px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="Storyboard.js">
  <span>See the Pen <a href="https://codepen.io/mmpataki/pen/NWprKWd">
  Storyboard.js</a> by Madhusoodan P (<a href="https://codepen.io/mmpataki">@mmpataki</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>


<br/><br/>


## Here is how it can be implemented
There are two components. Storyteller and Stories

## 1. Storyteller
Story teller is a framework which manages the stories to be told along with some supporting UI. The `back` and `next` button you just saw are managed by this framework.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=storyteller.js"></script>

## 2. Stories
Aforementioned storyteller takes input a HTML element to put up a story and draws stories on it. Stories have to be defined how they look and what their next story is (based on some input, if needed). They also define a few functions required by the framework to get the current state, exceptions before moving to next story etc. Here are some example stories used in above demo -

## a. PIN code input story (`PinCodeStory`)
This story takes input a PIN code and asks user to chose a Govt ID it redirects the user to next story based on inputs choosen (either to `AadharDetailsStory` or `PanDetailsStory`)
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=PinCodeStory.js"></script>

## b. Aadhar details story (`AadharDetailsStory`)
This one prompts user to input AAdhar card no. and validates it. It then redirects user to a story to authenticate the user through OTP.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=AadharDetailsStory.js"></script>

## c. Pan card details story (`PanDetailsStory`)
This one prompts user to input PAN card details and validates it. It then redirects user to a story to authenticate the user through OTP.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=PanDetailsStory.js"></script>

## d. OTP verification story (`OTPVerifyStory`)
This one prompts for a OTP and validates it against the generated one. It then redirects user to page where user is asked to choose a vaccination center.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=OTPVerifyStory.js"></script>

## e. Location picker story (`LocationPickerStory`)
This one allows user to pick vaccination location and redirects user to a summry page.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=LocationPickerStory.js"></script>

## f. Summary story  (`SummaryStory`)
This page just demonstrates the final output of the form in nice JSON format.
<script src="https://gist.github.com/mmpataki/a5d5d5e0c34ff87783de8bd5a13b6071.js?file=SummaryStory.js"></script>

## The `render` function
You might be wondering what this `render` function is? It's just a utility function I use to create quick UIs. Defined [here](https://gist.github.com/mmpataki/8abf53397ac22df4331116f1d334da22)
