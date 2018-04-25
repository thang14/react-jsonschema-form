import React, { Component } from "react";
import PropTypes from "prop-types";
import { dataURItoBlob, setState } from "../../utils";
import { withStyles } from "material-ui/styles";
import DeleteIcon from "@material-ui/icons/Delete";
function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${name};base64`);
}

// styles ...
const styles = theme => ({
  fileContainer: {
    display: "table",
    width: "100%",
  },
  fileItem: {
    float: "left",
    margin: "5px",
    position: "relative",
  },
  fileViewImage: {
    width: "100px",
    height: "100px",
  },
  deleteIcon: {
    position: "absolute",
    top: "-5px",
    right: "5px",
    cursor: "pointer",
    background: "#fff",
    borderRadius: "3px",
    border: "1px solid #eee",
  },
});

function processFile(file) {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = event => {
      resolve({
        dataURL: addNameToDataURL(event.target.result, name),
        name,
        size,
        type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  const { filesInfo } = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="file-info">
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        return (
          <li key={key}>
            <strong>{name}</strong> ({type}, {size} bytes)
          </li>
        );
      })}
    </ul>
  );
}

function extractFileInfo(dataURLs) {
  return dataURLs
    .filter(dataURL => typeof dataURL !== "undefined")
    .map(dataURL => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}

class FileWidget extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = { values, filesInfo: extractFileInfo(values) };
  }

  onChange = event => {
    const { multiple, onChange } = this.props;
    processFiles(event.target.files).then(filesInfo => {
      const state = {
        values: this.state.values.concat(
          filesInfo.map(fileInfo => fileInfo.dataURL)
        ),
        filesInfo: this.state.filesInfo.concat(filesInfo),
      };
      setState(this, state, () => {
        if (multiple) {
          onChange(state.values);
        } else {
          onChange(state.values[0]);
        }
      });
    });
  };

  deleteImage = key => () => {
    this.state.values.splice(key, 1);
    setState(this, {
      values: this.state.values,
      filesInfo: this.state.filesInfo,
    });
  };
  renderImagesView() {
    const { classes } = this.props;
    const values = this.state.values.filter(value => value != undefined);
    if (values.length == 0) {
      return null;
    }
    const files = values.map((file, key) => {
      return (
        <li key={key} className={classes.fileItem}>
          <span className={classes.deleteIcon} onClick={this.deleteImage(key)}>
            <DeleteIcon />
          </span>
          <img className={classes.fileViewImage} src={file} />
        </li>
      );
    });
    return <ul className={classes.fileContainer}>{files}</ul>;
  }

  render() {
    const { multiple, id, readonly, disabled, autofocus } = this.props;
    const { filesInfo } = this.state;
    return (
      <div>
        {this.renderImagesView()}
        <p>
          <input
            ref={ref => (this.inputRef = ref)}
            id={id}
            type="file"
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
          />
        </p>
        <FilesInfo filesInfo={filesInfo} />
      </div>
    );
  }
}

FileWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    autofocus: PropTypes.bool,
  };
}

export default withStyles(styles)(FileWidget);
