import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';

import { throttle } from 'common/utils/lodash';

import {
  PART_COLOR,
  PART_COLOR_LIGHTER,
  PART_LINE_WIDTH,
  BACKGROUND_COLOR,
  MIN_RADIUS_VALUE,
  RADIUS_RANGE,
  RADIUS_SPEED,
  LOADER_RADIUS,
  LOADER_SPEED,
  LOADER_OFFSET,
  LOADER_ACCELERATION,
  DEFAULT_ROTATE_LOADER_VALUE,
  RADIUS_ACCELERATION,
  SECOND_ANIMATION_RADIUS_SPEED,
  SECOND_ANIMATION_RADIUS_ACCELERATION,
  DEFAULT_ROTATE_VALUE,
  OFFSET_SPEED,
  DEFAULT_OFFSET_VALUE,
  REDRAW_CANVAS_TIME,
  ANIMATION_PART,
  BOUNCE_DURATION,
  FPS,
} from '../constants/settings';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.canvas = createRef();
    this.ratio = window.devicePixelRatio;

    const width = window.innerWidth * this.ratio;
    const height = window.innerHeight * this.ratio;

    this.deviceDiagonal = this.calculateDiagonal(width, height);

    this.state = {
      width,
      height,
      animationPart: ANIMATION_PART.first,
      animationId: 0,
      rotateValue: 0,
      radiusAcceleration: 0,
      loaderRadius: 0,
      loaderRotateValue: 0,
      bounceRadius: LOADER_RADIUS,
      bounceCurrentFrame: 0,
      offset: DEFAULT_OFFSET_VALUE,
      radius: this.deviceDiagonal,
      cancelAnimationFrame: false,
    };

    const drawCanvasWithThrottle = throttle(this.redrawCanvas, REDRAW_CANVAS_TIME);

    window.onresize = () => this.redrawCanvas();
  }

  componentDidMount() {
    const { current } = this.canvas;

    this.ctx = current.getContext('2d');

    requestAnimationFrame(this.drawAnimationParts);
  }

  componentDidUpdate(prevProps, prevState) {
    const { width, height } = this.state;

    if (prevState.width !== width || prevState.height !== height) {
      this.deviceDiagonal = this.calculateDiagonal(width, height);
    }
  }

  calculateDiagonal = (width, height) => (
    Math.sqrt((width ** 2) + (height ** 2)) / RADIUS_RANGE
  );

  redrawCanvas = () => {
    const { innerWidth, innerHeight } = window;
    const { animationId } = this.state;

    cancelAnimationFrame(animationId);

    this.setState({
      cancelAnimationFrame: true,
      width: innerWidth * this.ratio,
      height: innerHeight * this.ratio,
    });

    requestAnimationFrame(this.drawAnimationParts);
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

    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.arc(halfWidth, halfHeight, radius + PART_LINE_WIDTH, 0, Math.PI * 2);
    this.ctx.fill();
  };

  rotateCanvas = () => {
    const {
      width, height, rotateValue, cancelAnimationFrame,
    } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // because it draws a circle that rotates,
    // you need to clean a canvas in a circle
    this.clearRotatingCanvas();

    // TODO: try setTransform
    this.ctx.translate(halfWidth, halfHeight);

    if (cancelAnimationFrame) {
      this.ctx.rotate(rotateValue);
    } else {
      this.ctx.rotate(DEFAULT_ROTATE_VALUE);
    }

    this.ctx.translate(-halfWidth, -halfHeight);

    this.setState((prevState) => {
      const newRadiusValue = prevState.radius - RADIUS_SPEED - prevState.radiusAcceleration;

      return ({
        radius: newRadiusValue,
        cancelAnimationFrame: false,
        offset: prevState.offset - OFFSET_SPEED,
        rotateValue: prevState.rotateValue + DEFAULT_ROTATE_VALUE,
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
    this.ctx.lineWidth = PART_LINE_WIDTH;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = PART_COLOR;
    this.ctx.stroke();
  };

  firstAnimationPart = () => {
    const { radius, offset, radiusAcceleration } = this.state;

    if ((radius - RADIUS_SPEED - radiusAcceleration) < MIN_RADIUS_VALUE) {
      this.clearRotatingCanvas();
      this.setState({
        animationPart: ANIMATION_PART.second,
        radius: MIN_RADIUS_VALUE,
      });
    } else {
      this.rotateCanvas();

      this.drawOnePart(offset, Math.PI / 2 - offset); // IV quadrant
      this.drawOnePart(Math.PI / 2 + offset, Math.PI - offset); // III quadrant
      this.drawOnePart(Math.PI + offset, Math.PI + Math.PI / 2 - offset); // II quadrant
      this.drawOnePart(Math.PI + Math.PI / 2 + offset, Math.PI * 2 - offset); // I quadrant
    }
  };

  drawLoader = (startAngle, endAngle) => {
    const {
      width, height, loaderRadius, bounceRadius,
    } = this.state;

    const radius = loaderRadius >= LOADER_RADIUS ? bounceRadius : loaderRadius;

    this.ctx.beginPath();

    this.ctx.strokeStyle = BACKGROUND_COLOR;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.arc(width / 2, height / 2, radius, startAngle, endAngle);
    this.ctx.stroke();
  };

  secondAnimationPart = () => {
    const {
      width, height, radius, cancelAnimationFrame, rotateValue, loaderRotateValue, loaderRadius,
    } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.beginPath();

    this.ctx.translate(halfWidth, halfHeight);

    if (cancelAnimationFrame) {
      // rotateValue need because canvas already rotated (on rotateValue degree)
      this.ctx.rotate(rotateValue + loaderRotateValue);
    } else {
      this.ctx.rotate(DEFAULT_ROTATE_LOADER_VALUE);
    }

    this.ctx.translate(-halfWidth, -halfHeight);

    const gradient = this.ctx.createRadialGradient(halfWidth, halfHeight, 0, halfWidth, halfHeight, radius);
    gradient.addColorStop(0, PART_COLOR);
    gradient.addColorStop(1, PART_COLOR_LIGHTER);

    this.ctx.fillStyle = gradient;
    this.ctx.arc(halfWidth, halfHeight, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.drawLoader(LOADER_OFFSET, Math.PI - LOADER_OFFSET);
    this.drawLoader(Math.PI + LOADER_OFFSET, Math.PI * 2 - LOADER_OFFSET);

    if (loaderRadius >= LOADER_RADIUS) {
      this.bounce();
    }

    this.setState(prevState => ({
      cancelAnimationFrame: false,
      radius: radius > this.deviceDiagonal
        ? prevState.radius
        : (prevState.radius + SECOND_ANIMATION_RADIUS_SPEED) * SECOND_ANIMATION_RADIUS_ACCELERATION,
      loaderRadius: prevState.loaderRadius >= LOADER_RADIUS
        ? LOADER_RADIUS
        : (prevState.loaderRadius + LOADER_SPEED) * LOADER_ACCELERATION,
      loaderRotateValue: prevState.loaderRotateValue + DEFAULT_ROTATE_LOADER_VALUE,
      // animationPart: radius > this.deviceDiagonal
      //   ? ANIMATION_PART.third
      //   : ANIMATION_PART.second,
    }));
  };

  bounce = () => {
    const { bounceCurrentFrame } = this.state;

    const animationDuration = parseInt(BOUNCE_DURATION / FPS, 10);
    const frame = bounceCurrentFrame / animationDuration;

    // if you go to the last frame
    if (animationDuration === (bounceCurrentFrame - 1)) {
      return;
    }

    // 0.3 ~ 30%
    // need to pick up coefficients
    const value = frame < 0.3
      ? -15
      : (frame < 0.5 ? 10 : 0);


    this.setState(prevState => ({
      bounceRadius: prevState.bounceRadius + value,
      bounceCurrentFrame: prevState.bounceCurrentFrame + 1,
    }));
  };

  drawAnimationParts = () => {
    const { animationPart } = this.state;

    switch (animationPart) {
      case ANIMATION_PART.first: this.firstAnimationPart(); break;
      case ANIMATION_PART.second: this.secondAnimationPart(); break;

      default: break;
    }

    if (animationPart !== ANIMATION_PART.third) {
      const animationId = requestAnimationFrame(this.drawAnimationParts);
      this.setState({ animationId });
    }
  };

  render() {
    const { width, height } = this.state;
    const { label } = this.props;

    return (
      <div className="preloader">
        <p className="preloader__label">{label || 'Loading...'}</p>
        <canvas ref={this.canvas} width={width} height={height} />
      </div>
    );
  }
}

PageContainer.propTypes = {
  label: PropTypes.string,
};

export default PageContainer;
