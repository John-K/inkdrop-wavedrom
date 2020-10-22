'use babel';

const PropTypes = require('prop-types')
const React = require('react')
const { markdownRenderer } = require('inkdrop')
import CodeMirror from 'codemirror'
const json5 = require('json5/lib/index.js');
const renderWaveElement = require('wavedrom/lib/render-wave-element.js')
//TODO: support muiltiple skins in config
const WaveSkin  = require('wavedrom/skins/dark.js')

var CODEMIRROR_OPTS = {
	name: 'wavedrom',
	mime: 'application/x-json',
	mode: 'json',
	ext: [],
	alias: []
}

class Wavedrom extends React.Component {
  static propTypes = {
		children: PropTypes.arrayOf(PropTypes.string)
	}

	constructor(props) {
		super(props)
		this.state = { svg: '', error: null }
	}

	componentDidMount() {
		this.renderDiagram(this.props.children[0])
	}

	componentDidUpdate(prevProps) {
		if (prevProps.children[0] !== this.props.children[0]) {
			this.renderDiagram(this.props.children[0])
		}
	}

	componentWillUnmount() {
		this.cleanupMarkmapDiv()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return (
			nextProps.children[0] !== this.props.children[0] ||
			nextState.svg !== this.state.svg ||
			nextState.error !== this.state.error
		)
	}

	render() {
		const { error } = this.state
		if (error) console.log('WAVEDROM: render error', error.message)
		return (
			<div ref={el => (this.waveDromWrapper = el)}>
			<div className="wavedrom-diagram" id={this.wavedromId} ref={el => (this.waveDromDiv = el)} />
			  {error && (
				  <div className="ui error message">
				    <div className="header">Failed to render Wavedrom</div>
				    <div><pre>{error.message}</pre></div>
				   </div>
			  )}
			</div>
		)
	}

	renderDiagram(code) {
		try {
			// hacky JS code detection
			if (code.indexOf("\(") != -1) {
				throw new SyntaxError("Javascript code in Wavedrom is not supported.")
			}

			// fix for json5 not liking {} with nothing inside
			const data = json5.parse(code.replace("{}", "{ }"))
			if (data) {
				renderWaveElement(0, data, this.waveDromDiv, WaveSkin, false)
				this.setState({ error: null, svg: data})
			}
		} catch (e) {
			this.setState({ error: e, svg: ''})
		}
	}

	cleanupMarkmapDiv() {
		const el = this.waveDromWrapper
		if (el) {
			console.log("cleaning up div")
			el.remove()
		} else {
			console.log("Could not find Wavedrom div for cleanup")
		}
	}
}

module.exports = {
  activate() {
    if (markdownRenderer) {
		markdownRenderer.remarkCodeComponents.wavedrom = Wavedrom
	}

	// Enable syntax highlighting (Thanks Takuya!)
	if (CodeMirror) {
		CodeMirror.modeInfo.push(CODEMIRROR_OPTS)
	}
  },

  deactivate() {
    if (markdownRenderer) {
		markdownRenderer.remarkCodeComponents.wavedrom = null
	}
  }
};
