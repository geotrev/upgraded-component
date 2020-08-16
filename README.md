# \<upgraded-element\>

`UpgradedElement` is an accessible base class enabling modern component authoring techniques in custom elements. It weighs just 3kb minified + gzipped.

How does `upgraded-element` stand apart from other UI libraries/frameworks? It's built on top of native browser technologies: shadow roots, custom elements, making it lightning fast. Reconciliation (DOM updates) are restricted to shadow root contexts; this means a parent component re-rendering will not, by default, re-render its children, which significantly reduces render times. The reconciliation strategy is forked from [reefjs](https://github.com/cferdinandi/reef) by Chris Ferdinandi.

What you get:

1. Encapsulated [styles](#styles) and [view](#render) in a shadow root.
2. State management via [upgraded properties](#properties)
3. Predictable and familiar [lifecycle methods](#lifecycle), plus [public methods](#internal-methods-and-hooks) for custom render logic.

The class extends `HTMLElement` to give you [custom element callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks), too.

**Table of Contents**

- 📜 [Getting Started](#getting-started)
- 📥 [Install](#install)
- 🎮 [API](#api)
  - [Render](#render)
  - [Styles](#styles)
  - [Properties](#properties)
    - [Configuration Options](#configuration-options)
    - [Managed Properties](#managed-properties)
    - [Updating a Property](#updating-a-property)
  - [Lifecycle](#lifecycle)
    - [Methods](#methods)
    - [Using Custom Element Lifecycle Callbacks](#using-custom-element-lifecycle-callbacks)
  - [Internal Methods and Hooks](#internal-methods-and-hooks)
    - [requestRender](#requestRender)
    - [elementId](#elementId)
    - [validateType](#validatetypepropertyname-value-type)
  - [DOM Events](#dom-events)
- 🌍 [Browser Support](#browser-support)
- 🔎 [Under the Hood](#under-the-hood)
- 🏆 [Goals](#goals)
- 🤝 [Contribute](#contribute)

## Getting Started

Creating a new element is easy. Once you've [installed](#install) the package, extend `UpgradedElement`:

```js
// fancy-header.js

import { UpgradedElement, register } from "upgraded-element" // using node module

class FancyHeader extends UpgradedElement {
  static get styles() {
    return `
      .is-fancy {
        font-family: Baskerville; 
        color: fuchsia; 
      }
    `
  }

  render() {
    return `<h1 class='is-fancy'><slot></slot></h1>`
  }
}

// No need to export anything as custom elements aren't modules.

register("fancy-header", FancyHeader)
```

**Tip:** You can use all the expected features of web components here, including the `:host` CSS selector and slots (as shown above)!

Import or link to your element file, then use it:

```html
<fancy-header>Do you like my style?</fancy-header>
```

You can even use it in React:

```js
import React from "react"
import "./fancy-header"

const SiteBanner = (props) => (
  <div class="site-banner">
    <img src={props.src} alt="banner" />
    <fancy-header>{props.heading}</fancy-header>
  </div>
)
```

## Install

You can install either by grabbing the source file or with npm/yarn.

**NPM or Yarn**

Install it like you would any other package:

```sh
$ npm i upgraded-element
```

```sh
$ yarn i upgraded-element
```

Then import the package and create your new element, per [Getting Started](#getting-started) above. 🎉

**Source**

[ES Module](https://cdn.jsdelivr.net/npm/upgraded-element/lib/upgraded-element.esm.js) / [CommonJS](https://cdn.jsdelivr.net/npm/upgraded-element/lib/upgraded-element.cjs.js) / [UMD](https://cdn.jsdelivr.net/npm/upgraded-element/dist/upgraded-element.js) / [UMD (minified)](https://cdn.jsdelivr.net/npm/upgraded-element/dist/upgraded-element.min.js)

When linking to the source file with a `script` tag, be sure to include `integrity` and `crossorigin` attributes:

```html
<!-- Get unminified bundle for dev: -->
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/upgraded-element@latest/dist/undernet.bundle.js"
  integrity="sha256-TlaK/ReAb4QKlz9z1nM0M6au5+LLQoL19taGnMdXcGc="
  crossorigin="anonymous"
></script>

<!-- Or minified/uglified bundle: -->
<script
  type="text/javascript"
  src="https://cdn.jsdelivr.net/npm/upgraded-element@latest/dist/undernet.bundle.min.js"
  integrity="sha256-aqKVUUBUt4Na7CrubElDiJmeX3mgub7fXvnSXp36WKQ="
  crossorigin="anonymous"
></script>
```

Import directly:

```js
// fancy-header.js

import { UpgradedElement, register } from "./upgraded-element.js"
```

Then link to your script or module:

```html
<script type="module" defer src="path/to/fancy-header.js"></script>
```

## API

`UpgradedElement` has its own API to more tightly control things like rendering encapsulated HTML and styles, tracking renders via custom lifecycle methods, and using built-in state via upgraded class properties.

As mentioned in the beginning, the class extends `HTMLElement`, enabling access to custom element lifecycle callbacks. Be sure to read [notes on how to use them](#using-custom-element-lifecycle-callbacks) first, as `UpgradedElement` functionality piggy backs off of a few in particular.

### Render

Use the `render` method and return stringified HTML (it can also be a template string):

```js
render() {
  const details = { name: "Joey", location: "Nebraska" }
  return `Greetings from ${details.location}! My name is ${details.name}.`
}
```

### Styles

Use the static `styles` getter and return your stringified stylesheet:

```js
static get styles() {
  return `
    :host {
      display: block;
    }

    .fancy-element {
      font-family: Comic Sans MS;
    }
  `
}
```

### Properties

**TL;DR** Properties enable internal state in `UpgradedElement`. By defining a property, it will be upgraded to hook into the render lifecycle, similar to how state works in React.

Use the static `properties` getter and return an object, where each entry is the property name (key) and configuration (value). Property names should always be `camelCase`.

Example:

```js
static get properties() {
  return {
    myFavoriteNumber: {
      default: 12,
      type: "number",
    },
    myOtherCoolProp: {
      default: (element) => element.getAttribute("some-attribute"),
      type: "string",
      reflected: true,
    }
  }
}
```

#### Configuration Options

Configuration is optional. Simply setting the property configuration to an empty object - `{}` - will be enough to upgrade it.

Here are the properties accepted in the configuration object:

- **default** (`string` or `function`): The default value for the property. It can be a primitive value, or callback which computes the final value. The callback receives the `this` of your element, aka the HTML element itself.
- **type** (`string`): Describes the data type for the property value. Default values are checked, too. All primitive values are accepted as a valid type. Object enumeration support TBD.
- **reflected** (`boolean`): Indicates if the property should reflect onto the host as an attribute. If `true`, the property name will reflect in kebab-case. E.g., `myProp` becomes `my-prop`.

#### Updating a Property

A property in `UpgradedElement` is like any instance property on a JavaScript class. The difference is that it will be upgraded by default to hook into the render lifecycle.

Every time an upgraded property changes it will trigger the following steps (in order):

1. `elementAttributeChanged`, if reflected
2. `elementPropertyChanged`
3. Re-render to reflect the new property / attribute changes into the shadow root.

See [lifecycle](#lifecycle) methods below.

#### Managed Properties

There's also the option to skip accessor upgrading if you prefer to implement more custom functionality. This is referred to as a 'managed' property.

Here's a quick example for an `isOpen` property:

```js
static get properties() {
  return {
    // Hmm, what will this do?
    isOpen: { type: "boolean", default: false }
  }
}

constructor() {
  super()

  // provide a default value for the internal property
  this._isOpen = false
}

// Define accessors

set isOpen(value) {
  if (value === this.isOpen) return
  this._isOpen = value
}

get isOpen() {
  return this._isOpen
}
```

Tips:

1. Adding a managed property into the `properties` object **won't do anything so long as you've declared custom accessors.**
2. Always name the internal property something different than the accessor methods that get/set its value. In other words, `isOpen` gets and sets the property `_isOpen`. _Technically_ both are properties on the class, therefore if both are the same name, an error will be thrown later.
3. You can tap into the render lifecycle in your managed property's accessors. Let's try that out...

To achieve the existing behavior of an upgraded property, you can add in upgraded-element's [internal methods](#internal-methods-and-hooks). Using the previous `isOpen` as a base, let's add some more logic:

```js
if (value === this.isOpen) return

// Validate type, will print a warning if incorrect
this.validateType("isOpen", value, "boolean")

const oldValue = this.isOpen
this._isOpen = value

// Reflect property to an attribute, if desired:
this.setAttribute("is-open", String(value))

// Trigger elementPropertyChanged():
this.elementPropertyChanged("isOpen", oldValue, value)

// Render the updated values to the shadow root, which
// will later trigger elementDidUpdate():
this.requestRender()
```

With that, you'll have created a custom workflow very similar to what comes out of the box with an upgraded property, but with your own prescriptions.

Note that `requestRender` is asynchronous. See [Internal Methods and Hooks](#internal-methods-and-hooks) below on how you can track it using `elementDidUpdate`.

### Lifecycle

As mentioned previously, `UpgradedElement` provides its own custom lifecycle methods, but also gives you the option to use the [built-in callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks) as well. There is [one caveat](#using-custom-element-lifecycle-callbacks) to using the native callbacks, though.

The purpose of these is to add more developer fidelity to the existing callbacks as it pertains to the render lifecycle.

#### Methods

- `elementDidConnect`: Called at the beginning of `connectedCallback`, when the element has been attached to the DOM, but before the shadow root's HTML/styles have been rendered. Ideal for initializing any internal properties or data that need to be ready before the first render.

- `elementDidMount`: Called at the end of `connectedCallback`, once the shadow root / DOM is ready. Ideal for registering DOM events or performing other DOM-sensitive actions.

- `elementDidUpdate`: Called on each render after `elementDidMount`. This includes: when an upgraded property has been set or `requestRender` was called.

- `elementPropertyChanged(name, oldValue, newValue)`: Called each time a property gets changed. Provides the property name (as a string), the old value, and the new value. If the old value matches the new value, this method is not triggered. Create a [managed property](#managed-properties) to customize this behavior.

- `elementAttributeChanged(name, oldValue, newValue)`: Called each time an attribute is changed. If the old value matches the new value, this method is not triggered. Call `attributeChangedCallback` directly to customize this behavior.

- `elementWillUnmount`: Called by `disconnectedCallback`, right before the internal DOM nodes have been cleaned up. Ideal for unregistering event listeners, timers, or the like.

**Q:** "Why does `UpgradedElement` use lifecycle methods which seemingly duplicate the existing native callbacks?"

**A:** The primary purpose, as mentioned above, is adding more fidelity to the element render/update lifecycle in general. Another reason is for naming consistency. I borrowed similar naming conventions from React as they are already established and focus around state, similar to what `UpgradedComponent` does.

#### Using Custom Element Lifecycle Callbacks

`UpgradedElement` piggybacks off the native lifecycle callbacks, which means if you use them, you should also call `super` to get the custom logic added by the base class. **This is especially true of `connectedCallback` and `disconnectedCallback`, which triggers the initial render and DOM cleanup steps, respectively.**

Here's a quick reference for which lifecycle methods are dependent on the native callbacks:

- 🚨 `connectedCallback`: **`super` required**
  - Calls `elementDidConnect`
  - Calls `elementDidMount`
- 🏳 `attributeChangedCallback`: `super` optional
  - Calls `elementAttributeChanged`
- 🏳 `adoptedCallback` `super` recommended for future support
  - TBD, no methods called
- 🚨 `disconnectedCallback`: **`super` required**
  - Calls `elementWillUnmount`

In general, calling these with `super` is a safe bet.

### Internal Methods and Hooks

Because of the escape hatches that exist with managed properties and native lifecycle callbacks, it's necessary to provide hooks to access the methods which handle renders, type checking, and the like.

#### `requestRender`

Manually schedules an asynchronous render.

To track the results of the manual render, you can set an internal property and check its value via `elementDidUpdate` like so:

```js
elementDidUpdate() {
  if (this._renderRequested) {
    // Set tracker to false to prevent other renders from reaching this `if` branch
    this._renderRequested = false
    doSomeOtherStuff()
  }
}

someCallbackMethod() {
  this.doSomeStuff()

  // Set tracker just before render is called
  this._renderRequested = true
  this.requestRender()
}
```

#### `elementId`

This is an internal accessor that returns a unique identifier. E.g., `252u296xs51k7p6ph6v`.

You can access the id using the `element-id` attribute attached to any upgraded element.

#### `validateType(propertyName, value, type)`

The internal method which compares your property type. Useful if you are doing computations or other manipulations involving a reflected property.

**Use this method with caution for reflected properties.** You run the risk of an XSS attack. A future enhancement will provide a `sanitize` option which will encode the string to prevent this risk.

### DOM Events

To add event listeners, it's like you would do in any ES6 class. First, bind the callback in your element's `constructor`.

```js
constructor() {
  this.handleClick = this.handleClick.bind(this)
}
```

Then you can register events using `addEventListener` in your `elementDidMount` lifecycle method, and likewise, deregister events using `removeEventListener` in your `elementWillUnmount` lifecycle.

```js
handleClick() {
  // bound handler
}

elementDidMount() {
  this.button = this.shadowRoot.querySelector(".my-button")
  this.button.addEventListener("click", this.handleClick)
}

elementWillUnmount() {
  this.button.removeEventListener("click", this.handleClick)
}
```

## Browser Support

`UpgradedElement` uses symbols, ES6 classes, and the various features within the web component standard. The decision to not polyfill or transpile is deliberate in order to get the performance boost of browsers, which _by default_, support the newer features. Custom distributions will be made soon.

In the mean time, to get support in IE11, you will need some combination of Babel polyfill, `@babel/preset-env`, and/or a comprehensive [custom element polyfill solution](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

For more details on current web component spec support, check out the [caniuse](https://caniuse.com/#search=components) article which breaks support by sub-feature.

**Transpiling & Bundling:** If you use a bundler like webpack with `babel-loader`, you'll need to flag this package as needing processing in your config. For example, you can update your `exclude` option in your script processing rule like so:

```js
module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!upgraded-element)/, // <-- exclude this package
        loader: "babel-loader",
      },
    ],
  },
}
```

## Under the Hood

A few quick points on the design of `UpgradedElement`:

### Rendering

1. **Diffing the DOM:** Rendering is handled using a small DOM-diffing implementation, nearly identical to the one used in [reef](https://github.com/cferdinandi/reef) with some optimizations specific to shadow DOM concerns. The main reasoning here is to reduce package size and make rendering cheap and fast.

2. **Performance:** All renders are asynchronously requested to happen at the next animation frame. This is accomplished using a combination of `postMessage` and `requestAnimationFrame`. If `requestAnimationFrame` is not available, `setTimeout` with the minimum-allowed wait time is used (2-4 milliseconds depending on the browser). If `setTimeout` isn't available, then the render is called on the same frame as the `postMessage` handler.

## Goals

- **Intuitive API.** Provide an easy way to create a styled view in a shadow root and access useful methods at all stages of an element's lifecycle.

- **Consistent expectations.** Unexpected behavior, like `connectedCallback` being triggered when the element is disconnected, are guarded against so contracts are guaranteed. Escape hatches are provided for advanced control.

- **No magic.** Code that's required to use `UpgradedElement` is with existing technologies in the browser. Custom features are transparent with necessary documentation.

## Contribute

If you like the project or find issues, feel free to contribute!
