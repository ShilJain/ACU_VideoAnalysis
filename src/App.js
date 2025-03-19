import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import {
    CircularProgress,
    Button,
    TextField,
    Typography,
    Box,
    Paper,
    AppBar,
    Toolbar,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import backgroundImage from './CU.jpg'; // Update path if needed

const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontWeight: 'bold' },
    h5: { fontWeight: 'bold' },
    h6: { fontWeight: 'bold' },
    body1: { fontWeight: 'normal' },
  },
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f0f2f5' },
    text: { primary: '#333' },
  },
});

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [schemaFile, setSchemaFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // New state for tracking which content block is selected.
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleSchemaChange = (e) => {
    setSchemaFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !schemaFile) {
      alert("Please upload both video and schema files.");
      return;
    }

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('schema', schemaFile);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data.result);
      // Reset dropdown when new results arrive
      setSelectedContentIndex(0);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle changes in the dropdown selection
  const handleContentChange = (e) => {
    setSelectedContentIndex(e.target.value);
  };

  const renderFields = (content, index) => {
    const keyColorMap = {};
    const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2'];
    let colorIndex = 0;

    return (
      <Accordion key={index}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Content {index + 1}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {content.fields &&
            Object.entries(content.fields).map(([key, value]) => {
              if (!keyColorMap[key]) {
                keyColorMap[key] = colors[colorIndex % colors.length];
                colorIndex++;
              }

              return (
                <Box key={key} mb={2}>
                  <Typography variant="body2">
                    <span style={{ fontWeight: 'bold', color: keyColorMap[key] }}>
                      {key}:
                    </span> {value.valueString || "N/A"}
                  </Typography>
                </Box>
              );
            })}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderAllMarkdown = (contents) => {
    return (
      <Box mt={2} style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {contents.map((content, index) => (
          content.markdown ? (
            <Box key={index} mt={2}>
              <Typography variant="h6" gutterBottom>
                Transcript 
              </Typography>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {content.markdown}
              </Typography>
              <Divider />
            </Box>
          ) : null
        ))}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        style={{
          borderBottom: '1px solid #ddd',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '80px',
        }}
      >
        <Toolbar style={{ height: '100%' }}>
          <Typography variant="h4" color="inherit">
            Azure Content Understanding
          </Typography>
        </Toolbar>
      </AppBar>

      {!result ? (
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: 'calc(100vh - 80px)', margin: 0, width: '100%' }}
        >
          <Grid item xs={12} md={6}>
            <Paper elevation={3} style={{ padding: '2rem', backgroundColor: '#fff' }}>
              <Typography variant="h4" gutterBottom>
                Upload and Analyze Video
              </Typography>
              <form onSubmit={handleSubmit}>
                <Box mb={2}>
                  <TextField
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Choose a video file"
                    variant="outlined"
                  />
                </Box>
                <Box mb={2}>
                  <TextField
                    type="file"
                    accept="application/json"
                    onChange={handleSchemaChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Choose an Analyzer schema file"
                    variant="outlined"
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  style={{
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    borderRadius: 8,
                    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                    color: 'white',
                    height: 48,
                    padding: '0 30px',
                  }}
                >
                  Analyze File
                </Button>
                {loading && (
                  <Box mt={2} display="flex" alignItems="center">
                    <CircularProgress />
                    <Typography variant="body1" style={{ marginLeft: '1rem' }}>
                      Uploading and analyzing... Depending on the file size, it might take a few minutes to 1 hour.
                    </Typography>
                  </Box>
                )}
                {videoFile && (
                  <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                      Video Preview
                    </Typography>
                    <video controls style={{ width: '100%' }}>
                      <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                )}
              </form>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Grid
          container
          spacing={3}
          style={{ height: 'calc(100vh - 80px)', margin: 0, width: '100%' }}
        >
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              style={{ padding: '2rem', backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}
            >
              <Typography variant="h4" gutterBottom>
                Upload and Analyze Video
              </Typography>
              <form onSubmit={handleSubmit}>
                <Box mb={2}>
                  <TextField
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Choose a video file"
                    variant="outlined"
                  />
                </Box>
                <Box mb={2}>
                  <TextField
                    type="file"
                    accept="application/json"
                    onChange={handleSchemaChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    label="Choose an Analyzer schema file"
                    variant="outlined"
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  style={{
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    borderRadius: 8,
                    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                    color: 'white',
                    height: 48,
                    padding: '0 30px',
                  }}
                >
                  Analyze File
                </Button>
              </form>

              {loading && (
                <Box mt={2} display="flex" justifyContent="center" alignItems="center">
                  <CircularProgress />
                  <Typography variant="body1" style={{ marginLeft: '1rem' }}>
                    Uploading and analyzing... Depending on the file size, it might take a few minutes to 1 hour.
                  </Typography>
                </Box>
              )}

              {videoFile && (
                <Box mt={2} style={{ overflow: 'hidden' }}>
                  <Typography variant="h6" gutterBottom>
                    Video Preview
                  </Typography>
                  <video controls style={{ width: '100%' }}>
                    <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              style={{ padding: '2rem', backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}
            >
              <Typography variant="h5" gutterBottom>
                Video Analysis Results
              </Typography>
              <Box mb={2}></Box>
              {/* Dropdown to select content block */}
              <Box mb={2}>
                
                <FormControl fullWidth>
                  <InputLabel id="content-select-label">Select Scene</InputLabel>
                  <Box mb={2}></Box>
                  <Select
                    labelId="content-select-label"
                    value={selectedContentIndex}
                    onChange={handleContentChange}
                  >
                   
                    {result.contents.map((_, index) => (
                      <MenuItem key={index} value={index}>
                        Content {index + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              

              {/* Render fields for only the selected content block */}
              {renderFields(result.contents[selectedContentIndex], selectedContentIndex)}

              {/* Render markdown for all content blocks */}
              {renderAllMarkdown(result.contents)}
            </Paper>
          </Grid>
        </Grid>
      )}
    </ThemeProvider>
  );
}

export default App;