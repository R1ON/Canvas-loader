import React, { PureComponent, createRef } from 'react';
// import PropTypes from 'prop-types';

import { throttle } from 'common/utils/lodash';

import {
  PART_COLOR,
  PART_LINE_WIDTH,
  MIN_RADIUS_VALUE,
  RADIUS_RANGE,
  RADIUS_SPEED,
  RADIUS_ACCELERATION,
  DEFAULT_ROTATE_VALUE,
  OFFSET_SPEED,
  DEFAULT_OFFSET_VALUE,
  REDRAW_CANVAS_TIME,
} from '../constants/settings';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.ratio = window.devicePixelRatio;

    const width = window.innerWidth * this.ratio;
    const height = window.innerHeight * this.ratio;

    this.state = {
      width,
      height,
      animationId: 0,
      rotateValue: 0,
      radiusAcceleration: 0,
      offset: DEFAULT_OFFSET_VALUE,
      radius: Math.sqrt((width ** 2) + (height ** 2)) / RADIUS_RANGE, // device diagonal
      cancelNextAnimationFrame: false,
      cancelAnimationFrame: false,
    };

    this.canvas = createRef();

    const drawCanvasWithThrottle = throttle(this.redrawCanvas, REDRAW_CANVAS_TIME);

    window.onresize = () => drawCanvasWithThrottle();
  }

  componentDidMount() {
    const { current } = this.canvas;

    this.ctx = current.getContext('2d');

    requestAnimationFrame(this.drawArc);
  }

  redrawCanvas = () => {
    const { innerWidth, innerHeight } = window;
    const { animationId } = this.state;

    cancelAnimationFrame(animationId);

    this.setState({
      cancelAnimationFrame: true,
      width: innerWidth * this.ratio,
      height: innerHeight * this.ratio,
    });

    requestAnimationFrame(this.drawArc);
  };

  clearCanvas = () => {
    const { width, height } = this.state;

    this.ctx.clearRect(0, 0, width, height);
  };

  clearRotatingCanvas = () => {
    const { width, height, radius } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.clearCanvas();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.arc(halfWidth, halfHeight, radius + PART_LINE_WIDTH, 0, Math.PI * 2);
    this.ctx.fill();
  };

  rotateCanvas = () => {
    const {
      width, height, rotateValue, cancelAnimationFrame, cancelNextAnimationFrame,
    } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.clearRotatingCanvas();

    this.ctx.translate(halfWidth, halfHeight);

    if (cancelAnimationFrame || cancelNextAnimationFrame) {
      this.ctx.rotate(rotateValue);
    } else {
      this.ctx.rotate(DEFAULT_ROTATE_VALUE);
    }

    this.ctx.translate(-halfWidth, -halfHeight);

    this.setState((prevState) => {
      const newRadiusValue = prevState.radius - RADIUS_SPEED - prevState.radiusAcceleration;

      return ({
        cancelAnimationFrame: false,
        offset: prevState.offset - OFFSET_SPEED,
        rotateValue: prevState.rotateValue + DEFAULT_ROTATE_VALUE,
        radius: cancelNextAnimationFrame ? MIN_RADIUS_VALUE : newRadiusValue,
        radiusAcceleration: prevState.radiusAcceleration + RADIUS_ACCELERATION,
      });
    });
  };

  drawOnePart = (startAngle, endAngle) => {
    const { width, height, radius } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.beginPath();
    this.ctx.arc(halfWidth, halfHeight, radius, startAngle, endAngle);
    this.ctx.lineWidth = 20;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = PART_COLOR;
    this.ctx.stroke();
  };

  drawArc = () => {
    const {
      radius, offset, animationId: id, radiusAcceleration, cancelNextAnimationFrame,
    } = this.state;

    if ((radius - RADIUS_SPEED - radiusAcceleration) < MIN_RADIUS_VALUE) {
      this.setState({ animationId: id, cancelNextAnimationFrame: true, radius: MIN_RADIUS_VALUE });
      cancelAnimationFrame(id);
    }

    this.rotateCanvas();

    this.drawOnePart(offset, Math.PI / 2 - offset);
    this.drawOnePart(Math.PI / 2 + offset, Math.PI - offset);
    this.drawOnePart(Math.PI + offset, Math.PI + Math.PI / 2 - offset);
    this.drawOnePart(Math.PI + Math.PI / 2 + offset, Math.PI * 2 - offset);

    if (!cancelNextAnimationFrame) {
      const animationId = requestAnimationFrame(this.drawArc);
      this.setState({ animationId });
    }
  };

  render() {
    const { width, height } = this.state;

    return (
      <div className="page">
        <main className="page__main">
          <canvas ref={this.canvas} width={width} height={height} />
        </main>
      </div>
    );
  }
}

// PageContainer.propTypes = {
//   getWeatherDataByCity: PropTypes.func.isRequired,
//   weatherInfo: PropTypes.object.isRequired,
// };

export default PageContainer;
