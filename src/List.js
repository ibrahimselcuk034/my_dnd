import React from "react";
import _ from "lodash";
import __ from "lodash";
import { Motion, spring } from "react-motion";

const dataStructure = [
  [0, 1, 2],
  [3, 4, 5, 6, 7],
  [8, 9, 10, 11],
];

const reinsert = (array, colFrom, rowFrom, colTo, rowTo) => {
  const _array = array.slice(0);
  const val = _array[colFrom][rowFrom];
  _array[colFrom].splice(rowFrom, 1);
  _array[colTo].splice(rowTo, 0, val);
  calculateVisiblePositions(_array);
  return _array;
};

const gutterPadding = 21;
const clamp = (n, min, max) => Math.max(Math.min(n, max), min);
const getColumnWidth = () =>
  window.innerWidth / dataStructure.length -
  gutterPadding / dataStructure.length;
const height = 110;

let width = getColumnWidth(),
  layout = null;

const calculateVisiblePositions = (newOrder) => {
  width = getColumnWidth();
  layout = newOrder.map((column, col) => {
    return _.range(column.length + 1).map((item, row) => {
      return [width * col, height * row];
    });
  });
};

const springSetting1 = { stiffness: 180, damping: 10 };
const springSetting2 = { stiffness: 150, damping: 16 };

class List extends React.Component {
  state = {
    order: dataStructure,
    lastPress: null,
    currentColumn: null,
    isPressed: false,
    mouse: [0, 0],
    isResizing: false,
    delta: [0, 0],
  };

  componentWillMount = () => {
    this.resizeTimeout = null;
    calculateVisiblePositions(dataStructure);
  };

  componentDidMount = () => {
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("touchmove", this.handleTouchMove);
    window.addEventListener("touchend", this.handleMouseUp);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("resize", this.handleResize);
  };

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.handleResize);
  };

  handleTouchStart = (key, currentColumn, pressLocation, e) => {
    this.handleMouseDown(key, currentColumn, pressLocation, e.touches[0]);
  };

  handleTouchMove = (e) => {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  };

  handleMouseMove = ({ pageX, pageY }) => {
    const {
      order,
      lastPress,
      currentColumn: colFrom,
      isPressed,
      delta: [dx, dy],
    } = this.state;
    if (isPressed) {
      const mouse = [pageX - dx, pageY - dy];
      const colTo = clamp(Math.floor((mouse[0] + width / 2) / width), 0, 2);
      const rowTo = clamp(Math.floor((mouse[1] + height / 2) / height), 0, 100);
      const rowFrom = order[colFrom].indexOf(lastPress);
      const newOrder = reinsert(order, colFrom, rowFrom, colTo, rowTo);
      this.setState({
        mouse,
        order: newOrder,
        currentColumn: colTo,
      });
    }
  };

  handleMouseDown = (
    key,
    currentColumn,
    [pressX, pressY],
    { pageX, pageY }
  ) => {
    this.setState({
      lastPress: key,
      currentColumn,
      isPressed: true,
      delta: [pageX - pressX, pageY - pressY],
      mouse: [pressX, pressY],
    });
  };

  handleMouseUp = () => {
    this.setState({
      isPressed: false,
      delta: [0, 0],
    });
  };

  handleResize = () => {
    clearTimeout(this.resizeTimeout);
    this.applyResizingState(true);
    this.resizeTimeout = setTimeout(() => this.applyResizingState(false), 100);
  };

  applyResizingState = (isResizing) => {
    this.setState({ isResizing });
    calculateVisiblePositions(dataStructure);
  };

  render() {
    console.log(
      this.state,
      `Last selected List item is List ${this.state.lastPress + 1}`
    );

    const {
      order,
      lastPress,
      currentColumn,
      isPressed,
      mouse,
      isResizing,
    } = this.state;
    return (
      <div className="items">
        {order.map((column, colIndex) => {
          return column.map((row) => {
            let style,
              x,
              y,
              visualPosition = order[colIndex].indexOf(row),
              isActive =
                row === lastPress && colIndex === currentColumn && isPressed;
            if (isActive) {
              [x, y] = mouse;
              style = {
                translateX: x,
                translateY: y,
                scale: spring(1.1, springSetting1),
              };
            } else if (isResizing) {
              [x, y] = layout[colIndex][visualPosition];
              style = {
                translateX: x,
                translateY: y,
                scale: 1,
              };
            } else {
              [x, y] = layout[colIndex][visualPosition];
              style = {
                translateX: spring(x, springSetting2),
                translateY: spring(y, springSetting2),
                scale: spring(1, springSetting1),
              };
            }

            return (
              <Motion key={row} style={style}>
                {({ translateX, translateY, scale }) => (
                  <div
                    onMouseDown={this.handleMouseDown.bind(
                      null,
                      row,
                      colIndex,
                      [x, y]
                    )}
                    onTouchStart={this.handleTouchStart.bind(
                      null,
                      row,
                      colIndex,
                      [x, y]
                    )}
                    className={isActive ? "item is-active" : "item"}
                    style={{
                      WebkitTransform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                      zIndex:
                        row === lastPress && colIndex === currentColumn
                          ? 99
                          : visualPosition,
                    }}
                  >
                    List {row + 1}
                    <img src="https://loremflickr.com/320/240" />
                  </div>
                )}
              </Motion>
            );
          });
        })}
      </div>
    );
  }
}

export default List;
