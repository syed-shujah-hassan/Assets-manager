const React = require('react');
const { View } = require('react-native');

function MapView(props) {
  return React.createElement(View, props, props.children);
}

function Marker(props) {
  return React.createElement(React.Fragment, null, props.children);
}

module.exports = {
  __esModule: true,
  default: MapView,
  Marker,
  PROVIDER_GOOGLE: undefined,
};
