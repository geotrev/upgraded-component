import { Rotom } from "../../src/rotom"

class CoolLabel extends Rotom {
  constructor() {
    super()
    this.handleClick = this.handleClick.bind(this)
  }

  // Rotom component stuff
  static get properties() {
    return {
      firstName: {
        type: "string",
        reflected: true,
        initialValue: "Kelso",
      },
      changeCount: {
        type: "number",
        initialValue: 0,
      },
    }
  }

  componentDidUpdate() {
    console.log("Updated")
  }

  componentDidMount() {
    console.log("Mounted")
    this.button = this.shadowRoot.querySelector("#update-btn")
    this.button.addEventListener("click", this.handleClick)
  }

  componentWillUnmount() {
    console.log("Unmounting")
    this.button.removeEventListener("click", this.hnadleClick)
  }

  styles() {
    return `:host { display: block; } .compliments { font-weight: bold; }`
  }

  render() {
    return `
      <p style="background-color: ${this.getRandomBG}; color: ${this.getRandomColor}">
        You've changed names ${this.changeCount} times
      </p>
      <p class="compliments" data-select="${this.firstName}">You're awesome, ${this.firstName}!</p>
      <button id="update-btn">Change Name</button>
    `
  }

  // cool-label methods

  getNewName() {
    const names = ["Perry", "JD", "Elliot", "Chris", "Carla"]
    const newName = names[Math.floor(Math.random() * names.length)]
    if (newName === this.firstName) return this.getNewName()

    return newName
  }

  handleClick() {
    this.changeCount = this.changeCount + 1
    this.firstName = this.getNewName()
  }

  get getRandomBG() {
    return ["darkorange", "blue", "darkblue", "green", "purple"][Math.floor(Math.random() * 5)]
  }

  get getRandomColor() {
    return ["skyblue", "lime", "white"][Math.floor(Math.random() * 3)]
  }
}

if (!customElements.get("cool-label")) customElements.define("cool-label", CoolLabel)
