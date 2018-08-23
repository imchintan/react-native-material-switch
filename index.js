import React from 'react'
import {
  PanResponder,
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types'

class MaterialSwitch extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    activeText: PropTypes.string,
    inactiveText: PropTypes.string,
    activeTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    inactiveTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    inactiveButtonPressedColor: PropTypes.string,
    activeButtonColor: PropTypes.string,
    activeButtonPressedColor: PropTypes.string,
    buttonShadow: ViewPropTypes.style,
    activeBackgroundColor: PropTypes.string,
    inactiveBackgroundColor: PropTypes.string,
    buttonRadius: PropTypes.number,
    switchWidth: PropTypes.number,
    switchHeight: PropTypes.number,
    buttonContent: PropTypes.element,
    enableSlide: PropTypes.bool,
    switchAnimationTime: PropTypes.number,
    onActivate: PropTypes.func,
    onDeactivate: PropTypes.func,
    onChangeState: PropTypes.func,
  };

  static defaultProps = {
    active: false,
    activeText: '',
    inactiveText: '',
    activeTextStyle: {},
    inactiveTextStyle: {},
    inactiveButtonPressedColor: '#42A5F5',
    activeButtonColor: '#F5F5F5',
    activeButtonPressedColor: '#F5F5F5',
    inactiveButtonColor: '#FEFEFE',
    buttonShadow: {
      elevation: 3,
      shadowColor: '#CFCFCF',
      shadowOpacity: 0.5,
      shadowRadius: 1,
      shadowOffset: { height: 1, width: 0 },
    },
    activeBackgroundColor: '#42A5F5',
    inactiveBackgroundColor: '#CFCFCF',
    buttonRadius: 13,
    switchWidth: 50,
    switchHeight: 30,
    buttonContent: null,
    enableSlide: true,
    switchAnimationTime: 200,
    onActivate: function() {},
    onDeactivate: function() {},
    onChangeState: function() {},
  };

  constructor(props) {
    super(props);
    var w =  props.switchWidth - Math.round(props.buttonRadius*2)-2//props.switchWidth - Math.min(props.switchHeight, props.buttonRadius*2);
    this.state = {
      width: w,
      state: props.active,
      position: new Animated.Value(props.active? w : 0),
    };
  }

  padding = 8;
  start = {};

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.setState({pressed: true});
        this.start.x0 = gestureState.x0;
        this.start.pos = this.state.position._value;
        this.start.moved = false;
        this.start.state = this.state.state;
        this.start.stateChanged = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.start.moved = true;
        if (this.start.pos == 0) {
          if (gestureState.dx <= this.state.width && gestureState.dx >= 0) {
            this.state.position.setValue(gestureState.dx);
          }
          if (gestureState.dx > this.state.width) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < 0) {
            this.state.position.setValue(0);
          }
        }
        if (this.start.pos == this.state.width) {
          if (gestureState.dx >= -this.state.width && gestureState.dx <= 0) {
            this.state.position.setValue(this.state.width+gestureState.dx);
          }
          if (gestureState.dx > 0) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < -this.state.width) {
            this.state.position.setValue(0);
          }
        }
        var currentPos = this.state.position._value;
        this.onSwipe(currentPos, this.start.pos,
          () => {
            if (!this.start.state) this.start.stateChanged = true;
            this.setState({state: true})
          },
          ()=>{
            if (this.start.state) this.start.stateChanged = true;
            this.setState({state: false})
          });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.setState({pressed: false});
        var currentPos = this.state.position._value;
        if (!this.start.moved || (Math.abs(currentPos-this.start.pos)<5 && !this.start.stateChanged)) {
          this.toggle();
          return;
        }
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        var currentPos = this.state.position._value;
        this.setState({pressed: false});
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.state !== nextProps.active){
      nextProps.active ? this.activate() : this.deactivate()
    }
  }

  onSwipe = (currentPosition, startingPosition, onChange, onTerminate) => {
    if (currentPosition-startingPosition >= 0) {
      if (currentPosition-startingPosition > this.state.width/2 || startingPosition == this.state.width) {
        onChange();
      } else {
        onTerminate();
      }
    } else {
      if (currentPosition-startingPosition < -this.state.width/2) {
        onTerminate();
      } else {
        onChange();
      }
    }
  };

  activate = () => {
    Animated.timing(
      this.state.position,
      {
        toValue: this.state.width,
        duration: this.props.switchAnimationTime,
      }
    ).start();
    this.changeState(true);
  };

  deactivate = () => {
    Animated.timing(
      this.state.position,
      {
        toValue: 0,
        duration: this.props.switchAnimationTime,
      }
    ).start();
    this.changeState(false);
  };

  changeState = (state) => {
    var callHandlers = this.start.state != state;
    setTimeout(() => {
      this.setState({state : state});
      if (callHandlers) {
        this.callback();
      }
    }, this.props.switchAnimationTime/2);
  };

  callback = () => {
    var state = this.state.state;
    if (state) {
      this.props.onActivate();
    } else {
      this.props.onDeactivate();
    }
    this.props.onChangeState(state);
  };

  toggle = () => {
    if (!this.props.enableSlide) return;

    if (this.state.state) {
      this.deactivate();
    } else {
      this.activate();
    }
  };

  render() {
    var doublePadding = this.padding*2;
    var halfPadding = doublePadding/2;
    return (
      <View
        {...this._panResponder.panHandlers}
        style={{padding: this.padding, position: 'relative'}}>
        <View
          style={{
            backgroundColor: this.state.state ? this.props.activeBackgroundColor : this.props.inactiveBackgroundColor,
            height: this.props.switchHeight+2,
            width: this.props.switchWidth+2,
            borderRadius: (this.props.switchHeight+2)/2,
            padding: 2,
          }}/>
        <TouchableOpacity underlayColor='transparent' activeOpacity={1} style={{
            height: Math.max(this.props.buttonRadius*2+doublePadding, this.props.switchHeight+doublePadding),
            width: this.props.switchWidth+doublePadding,
            position: 'absolute',
            top:1,
            left:2,
          }}>
          <Text style={[{
              color: this.state.state?'#FFFFFF':'#333333',
              textAlign: this.state.state?'left':'right',
              paddingVertical: doublePadding - 3,
              paddingHorizontal: doublePadding
          }, this.state.state? this.props.activeTextStyle:this.props.inactiveTextStyle]}>
            {this.state.state?this.props.activeText:this.props.inactiveText}
          </Text>
          <Animated.View style={[{
              backgroundColor:
                this.state.state
                  ? (this.state.pressed? this.props.activeButtonPressedColor : this.props.activeButtonColor)
                  : (this.state.pressed? this.props.inactiveButtonPressedColor : this.props.inactiveButtonColor),
              height: this.props.buttonRadius*2,
              width: this.props.buttonRadius*2,
              borderRadius: this.props.buttonRadius,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              position: 'absolute',
              top: halfPadding + this.props.switchHeight/2 - this.props.buttonRadius,
              left: this.props.switchHeight/2 > this.props.buttonRadius ? halfPadding : halfPadding + this.props.switchHeight/2 - this.props.buttonRadius,
              transform: [{ translateX: this.state.position }]
            },
            this.props.buttonShadow]}
          >
            {this.props.buttonContent}
          </Animated.View>
        </TouchableOpacity>
      </View>
    )
  }
}

module.exports = MaterialSwitch;
