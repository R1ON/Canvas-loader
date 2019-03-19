import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';

import { throttle } from 'common/utils/lodash';

import {
  COLORS,
  ANIMATION_PART,
  FIRST_ANIMATION,
  SECOND_ANIMATION,
  TEXT_INSIDE_LOADER,
  REDRAW_CANVAS_TIME,
} from '../constants/settings';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.canvas = createRef();
    this.ratio = window.devicePixelRatio;

    const width = window.innerWidth * this.ratio;
    const height = window.innerHeight * this.ratio;

    this.deviceDiagonal = this.calculateDiagonal(width, height);

    const { offsetBetweenParts } = FIRST_ANIMATION;

    const {
      minLoaderRadius,
      increaseSpeed,
      minTextAlpha,
      defaultRotateLoaderValue,
    } = SECOND_ANIMATION;

    this.state = {
      width, // canvas width
      height, // canvas height

      animationId: 0,
      animationPart: ANIMATION_PART.first, // current working animation
      cancelAnimationFrame: false,

      offset: offsetBetweenParts,
      radius: this.deviceDiagonal,
      rotateBackgroundValue: 0,

      backgroundRadiusAcceleration: 0,

      loaderRadius: 0,
      loaderRotateValue: 0,
      currentRotateValue: defaultRotateLoaderValue,
      endLoaderAnimation: false,
      increaseRadius: minLoaderRadius,
      increaseSpeed,

      textAlpha: minTextAlpha,
      needToAdd: true,
    };

    const drawCanvasWithThrottle = throttle(this.redrawCanvas, REDRAW_CANVAS_TIME);

    window.onresize = () => drawCanvasWithThrottle();
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
    Math.sqrt((width ** 2) + (height ** 2)) / FIRST_ANIMATION.rangeRadius
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

  rotateCanvas = () => {
    const {
      width, height, rotateBackgroundValue, cancelAnimationFrame,
    } = this.state;

    const { defaultRotateValue } = FIRST_ANIMATION;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.clearRect(-this.deviceDiagonal, -this.deviceDiagonal, this.deviceDiagonal * 3, this.deviceDiagonal * 3);

    this.ctx.translate(halfWidth, halfHeight);

    if (cancelAnimationFrame) {
      this.ctx.rotate(rotateBackgroundValue);
    } else {
      this.ctx.rotate(defaultRotateValue);
    }

    this.ctx.translate(-halfWidth, -halfHeight);

    this.setState((prevState) => {
      const { radiusSpeed, radiusAcceleration, offsetSpeed } = FIRST_ANIMATION;
      const newRadiusValue = prevState.radius - radiusSpeed - prevState.backgroundRadiusAcceleration;

      return ({
        radius: newRadiusValue,
        cancelAnimationFrame: false,
        offset: prevState.offset - offsetSpeed,
        rotateBackgroundValue: prevState.rotateBackgroundValue + defaultRotateValue,
        backgroundRadiusAcceleration: prevState.backgroundRadiusAcceleration + radiusAcceleration,
      });
    });
  };

  drawOnePart = (startAngle, endAngle) => {
    const { partLineWidth } = FIRST_ANIMATION;
    const { main } = COLORS;
    const { width, height, radius } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.beginPath();
    this.ctx.arc(halfWidth, halfHeight, radius, startAngle, endAngle);
    this.ctx.lineWidth = partLineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = main;
    this.ctx.stroke();
  };

  firstAnimationPart = () => {
    const { radiusSpeed, minRadiusValue } = FIRST_ANIMATION;
    const { radius, offset, backgroundRadiusAcceleration } = this.state;

    if ((radius - radiusSpeed - backgroundRadiusAcceleration) < minRadiusValue) {
      this.clearCanvas();
      this.setState({
        animationPart: ANIMATION_PART.second,
        radius: minRadiusValue,
      });

      setTimeout(() => this.setState({
        endLoaderAnimation: true,
      }), 3000);
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
      width, height, loaderRadius, increaseRadius,
    } = this.state;

    const { white } = COLORS;
    const { minLoaderRadius } = SECOND_ANIMATION;

    const radius = loaderRadius >= minLoaderRadius ? increaseRadius : loaderRadius;

    this.ctx.beginPath();

    this.ctx.strokeStyle = white;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.arc(width / 2, height / 2, radius, startAngle, endAngle);
    this.ctx.stroke();
  };

  gradualIncreaseEffect = () => {
    const { increaseRadius, increaseSpeed, currentRotateValue } = this.state;

    const {
      minLoaderRadius,
      maxLoaderRadius,
      percentOfDecrease,
      decreaseSpeedOfIncreaseSpeed,
    } = SECOND_ANIMATION;

    // if (currentRotateValue === 0) {
    //   return this.setState(prevState => ({
    //     increaseRadius: increaseRadius > 250 ? increaseRadius : prevState.increaseRadius + 5,
    //   }));
    // }

    if (parseInt(increaseRadius, 10) >= maxLoaderRadius || currentRotateValue === 0) {
      return;
    }

    const percentageValue = ((maxLoaderRadius - minLoaderRadius) * percentOfDecrease / 100) + minLoaderRadius;

    let finalIncreaseSpeed = increaseSpeed;

    if (increaseRadius >= percentageValue) {
      const speed = increaseSpeed - decreaseSpeedOfIncreaseSpeed;

      if (speed <= 0.1) {
        finalIncreaseSpeed = 0.1;
      } else {
        finalIncreaseSpeed = speed;
      }
    }

    this.setState(prevState => ({
      increaseRadius: prevState.increaseRadius + increaseSpeed,
      increaseSpeed: finalIncreaseSpeed,
    }));
  };

  rotateLoader = () => {
    const { width, height, loaderRotateValue } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.beginPath();

    this.ctx.translate(halfWidth, halfHeight);
    this.ctx.rotate(loaderRotateValue);

    this.ctx.translate(-halfWidth, -halfHeight);
  };

  drawGradient = () => {
    const {
      width,
      height,
      radius,
    } = this.state;

    const { main, lighterMain } = COLORS;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // TODO градиент при зуме не работает нормально
    // при апдейте нужно пересчитывать радиус
    const gradient = this.ctx.createRadialGradient(halfWidth, halfHeight, 0, halfWidth, halfHeight, radius);
    gradient.addColorStop(0, main);
    gradient.addColorStop(1, lighterMain);

    this.ctx.fillStyle = gradient;
    this.ctx.arc(halfWidth, halfHeight, radius, 0, Math.PI * 2);
    this.ctx.fill();
  };

  drawLoadingText = () => {
    const {
      width,
      height,
      textAlpha,
      loaderRadius,
      increaseRadius,
    } = this.state;

    const { label } = this.props;
    const { white } = COLORS;
    const { minLoaderRadius } = SECOND_ANIMATION;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.resetTransform();
    this.ctx.save();

    const clipRadius = loaderRadius >= minLoaderRadius ? increaseRadius : loaderRadius;
    this.ctx.arc(halfWidth, halfHeight, clipRadius, 0, Math.PI * 2);
    this.ctx.clip();

    // todo scale from 1.5 to 1
    this.ctx.globalAlpha = textAlpha;
    this.ctx.font = '22px RalewayL, sans-serif';
    this.ctx.fillStyle = white;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label || TEXT_INSIDE_LOADER, halfWidth, halfHeight);

    this.ctx.restore();
  };

  newTextAlphaValue = (prevTextAlpha) => {
    const { textAlpha, needToAdd } = this.state;
    const { maxTextAlpha, minTextAlpha, textAlphaSpeed } = SECOND_ANIMATION;

    let newTextAlpha;
    let needToAddNewValue = needToAdd;

    if (textAlpha >= maxTextAlpha) needToAddNewValue = false;
    if (textAlpha <= minTextAlpha) needToAddNewValue = true;

    if (needToAddNewValue) { // opacity can't be more then 1
      newTextAlpha = prevTextAlpha + textAlphaSpeed > 1 ? 1 : prevTextAlpha + textAlphaSpeed;
    } else { // opacity can't be less then 0
      newTextAlpha = prevTextAlpha - textAlphaSpeed < 0 ? 0 : prevTextAlpha - textAlphaSpeed;
    }

    return {
      newTextAlpha,
      needToAddNewValue,
    };
  };

  secondAnimationPart = () => {
    const {
      radius,
      loaderRadius,
      endLoaderAnimation,
      currentRotateValue,
    } = this.state;

    const {
      minLoaderRadius,
      loaderSpeed,
      loaderOffsetBetweenParts,
      loaderAcceleration,
      slowdownRotate,
      backgroundRadiusSpeed,
      backgroundRadiusAcceleration,
    } = SECOND_ANIMATION;

    this.rotateLoader();

    this.drawGradient();

    this.drawLoader(loaderOffsetBetweenParts, Math.PI - loaderOffsetBetweenParts);
    this.drawLoader(Math.PI + loaderOffsetBetweenParts, Math.PI * 2 - loaderOffsetBetweenParts);

    this.drawLoadingText();

    if (loaderRadius >= minLoaderRadius) {
      this.gradualIncreaseEffect();
    }

    return this.setState((prevState) => {
      const {
        newTextAlpha,
        needToAddNewValue,
      } = this.newTextAlphaValue(prevState.textAlpha);

      let nextRotateValue = currentRotateValue;

      if (endLoaderAnimation) {
        const reducedAngle = currentRotateValue - slowdownRotate;

        if (reducedAngle > 0) {
          nextRotateValue = reducedAngle;
        } else {
          nextRotateValue = 0;
        }
      }

      return ({
        cancelAnimationFrame: false,
        needToAdd: needToAddNewValue,
        textAlpha: newTextAlpha,
        radius: radius > this.deviceDiagonal
          ? prevState.radius
          : (prevState.radius + backgroundRadiusSpeed) * backgroundRadiusAcceleration,
        loaderRadius: prevState.loaderRadius >= minLoaderRadius
          ? minLoaderRadius
          : (prevState.loaderRadius + loaderSpeed) * loaderAcceleration,
        loaderRotateValue: prevState.loaderRotateValue + currentRotateValue,
        currentRotateValue: nextRotateValue,
        animationPart: nextRotateValue === 0
          ? ANIMATION_PART.third
          : ANIMATION_PART.second,
      });
    });
  };

  thirdAnimationPart = () => {
    const {
      loaderOffsetBetweenParts,
    } = SECOND_ANIMATION;
    this.rotateLoader();

    this.drawGradient();

    this.drawLoader(loaderOffsetBetweenParts, Math.PI - loaderOffsetBetweenParts);
    this.drawLoader(Math.PI + loaderOffsetBetweenParts, Math.PI * 2 - loaderOffsetBetweenParts);

    this.drawLoadingText();

    this.setState((prevState) => {
      const {
        newTextAlpha,
        needToAddNewValue,
      } = this.newTextAlphaValue(prevState.textAlpha);

      return ({
        needToAdd: needToAddNewValue,
        textAlpha: newTextAlpha,
      });
    });
  };

  drawAnimationParts = () => {
    const { animationPart } = this.state;

    switch (animationPart) {
      case ANIMATION_PART.first: this.firstAnimationPart(); break;
      case ANIMATION_PART.second: this.secondAnimationPart(); break;
      case ANIMATION_PART.third: this.thirdAnimationPart(); break;

      default: break;
    }

    if (animationPart !== ANIMATION_PART.fourth) {
      const animationId = requestAnimationFrame(this.drawAnimationParts);
      this.setState({ animationId });
    }
  };

  render() {
    const { width, height } = this.state;

    return (
      <div className="preloader">
        <canvas ref={this.canvas} width={width} height={height} />
      </div>
    );
  }
}

PageContainer.propTypes = {
  label: PropTypes.string,
};

export default PageContainer;
