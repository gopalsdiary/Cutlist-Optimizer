# CutList Optimizer

A simple web-based tool to optimize cutting layouts for woodworking projects, similar to [cutlistoptimizer.com](https://www.cutlistoptimizer.com/).

## Features

- Add and manage parts with dimensions, quantities, and materials
- Define stock sheets with custom sizes
- Automatically calculate optimal cutting layouts to minimize waste
- Visualize cutting diagrams with part placement and cut lines
- Configure cutting options (kerf width, rotation, grain direction)
- Save projects locally in your browser

## How to Use

1. **Add Parts**: Enter the dimensions and quantities of the parts you need to cut.
2. **Add Stock Sheets**: Define the materials and sizes of the stock sheets you have available.
3. **Configure Options**: Set your saw kerf width and other preferences.
4. **Calculate**: Click the Calculate button to generate optimized cutting layouts.
5. **Review Results**: View the cutting diagrams and statistics about material usage.

## Getting Started

### Running Locally

1. Clone or download this repository
2. Open the `index.html` file in your web browser

No installation or server setup is required - this is a pure HTML/CSS/JavaScript application that runs entirely in your browser.

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses a greedy bin-packing algorithm for layout optimization
- Saves projects to browser's localStorage

## License

This project is open source and free to use.

## Acknowledgments

Inspired by commercial applications like [cutlistoptimizer.com](https://www.cutlistoptimizer.com/) but created as a free, open-source alternative. 