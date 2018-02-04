import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import Find from 'lodash/find';
import Size from 'lodash/size';
import ScrollArea from 'react-scrollbar';
import Grid from 'material-ui/Grid';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import DeleteIcon from 'material-ui-icons/Delete';
import IconButton from 'material-ui/IconButton';
// import MenuIcon from 'material-ui-icons/Menu';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import Checkbox from 'material-ui/Checkbox';
import TextField from 'material-ui/TextField';
import Tabs, { Tab } from 'material-ui/Tabs';
import List, {
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from 'material-ui/List';
// import Icon from 'material-ui/Icon';

import './App.css';

const LogComponent = props => (
    <List className="logs-list">
        {props.errors.map(error => (
            <ListItem button key={error.id}>
                <ListItemText primary={error.err} secondary={error.document} />
            </ListItem>
      ))}
    </List>
  );

const ChecklistArticles = props => (
    <List className="logs-list">
        {props.articles.map(article => (
            <ListItem button key={article.id}>
                <ListItemText primary={article.title} secondary={article.date} />
            </ListItem>
        ))}
    </List>
    );

const TabContainer = props => (
    <Typography component="div" className="logs-content">
        <ScrollArea
            speed={0.8}
            className="area"
            horizontal={false}
            minScrollSize={40}>
            {props.children}
        </ScrollArea>
    </Typography>
  );

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

const ViewLogs = props => (
    <div className="logs-container">
        <AppBar position="static" color="default">
            <Tabs
                value={props.value}
                onChange={props.onTabsChange}
                indicatorColor="primary"
                textColor="primary">
                <Tab label="Foutmeldingen" />
                <Tab label="Gekeurde artikelen" />
                <Tab label="Ongekeurde artikelen" />
                <Tab label="Verlopen artikelen" />
            </Tabs>
        </AppBar>
        {props.value === 0 &&
            <TabContainer>
                <LogComponent errors={props.errors} />
            </TabContainer>}
        {props.value === 1 &&
            <TabContainer>
                <ChecklistArticles articles={props.articles.approved} />
            </TabContainer>}
        {props.value === 2 &&
            <TabContainer>
                <ChecklistArticles articles={props.articles.unapproved} />
            </TabContainer>}
        {props.value === 3 &&
            <TabContainer>
                <ChecklistArticles articles={props.articles.expired} />
            </TabContainer>}
    </div>
    );

ViewLogs.propTypes = {
    onTabsChange: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
    errors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        err: PropTypes.string.isRequired,
        document: PropTypes.string.isRequired,
    })).isRequired,
    articles: PropTypes.shape({
        approved: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            title: PropTypes.string.isRequired,
            date: PropTypes.string.isRequired,
        })).isRequired,
        unapproved: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            title: PropTypes.string.isRequired,
            date: PropTypes.string.isRequired,
        })).isRequired,
        expired: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            title: PropTypes.string.isRequired,
            date: PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
};

const FileManager = props => (
    <Card className="filemanager">
        <CardContent>
            <Typography type="headline" component="h2" align="left">Bestanden</Typography>
            {
              Size(Find(props.files, { selected: true })) ?
                  <Button raised color="primary" onClick={props.onProcessFilesClick}>Geselecteerde bestanden verwerken</Button>
            : ''
            }
            <List>
                {props.files.map((file, index) => (
                    <ListItem
                        key={file.id}
                        dense
                        button>
                        <Checkbox
                            checked={file.selected}
                            tabIndex={-1}
                            disableRipple
                            onClick={e => props.onSelectChange(e.target.checked, index)} />
                        <ListItemText primary={file.name} />
                        <ListItemSecondaryAction>
                            <IconButton aria-label="Verwijderen" onClick={() => props.onDelete(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
          ))}
            </List>

            <form className="upload-file-form">
                <Button fab mini color="primary" aria-label="add" className="upload-file">
                    <AddIcon />
                </Button>

            </form>
        </CardContent>
    </Card>
    );

FileManager.propTypes = {
    // onSelectChange: PropTypes.func.isRequired,
    files: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        selected: PropTypes.bool.isRequired,
    })).isRequired,
};

const Status = props => (
    <Card className="status">
        <CardContent>
            <Typography type="headline" component="h2" align="left">Status</Typography>
            <Typography className="process-status" component="h3">
                { props.running ? 'Actief' : 'Gestopt' }
            </Typography>
            {
              props.running ?
                  <Typography className="process-status-log" component="p">
                Wachten op bestanden...
                  </Typography>
              : ''
            }

        </CardContent>
    </Card>
);

const ControlProcess = props =>
     (
         <Card className="start-stop">
             <CardContent>
                 <CardActions>
                     { props.running ?
                         <Button raised color="primary" onClick={props.onStop}>Stop proces</Button>
                      :
                         <Button raised color="primary" onClick={props.onStart}>Start proces</Button>
                    }
                 </CardActions>
                 <form>
                     { props.running ? '' :
                     <FormGroup>
                         <FormControlLabel
                             control={
                                 <Checkbox
                                     checked={props.scheduledStartChecked}
                                     onChange={props.onScheduledStartChanged} />
                        }
                             label="Uitgesteld starten" />
                     </FormGroup>
               }

                     { props.scheduledStartChecked && !props.running ?
                         <FormGroup>
                             <TextField
                                 id="datetime-local"
                                 label="Datum/tijd"
                                 type="datetime-local"
                                 defaultValue={Moment().format('YYYY-MM-DDTHH:mm')}
                                 InputLabelProps={{
                                     shrink: true,
                                 }} />
                         </FormGroup>
                       : ''
               }
                 </form>
             </CardContent>
         </Card>
    );

ControlProcess.propTypes = {
    running: PropTypes.bool.isRequired,
    scheduledStartChecked: PropTypes.bool.isRequired,
    onStart: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onScheduledStartChanged: PropTypes.func.isRequired,
};

class App extends React.Component {
    getInitialState: () => {
      errors: [],
      articles: {
        approved: [],
        unapproved: [],
        expired: []
      },
      files: []
  };

    state = {
        running: false,
        scheduledStartChecked: false,
        activeLogsTab: 0,
        errors: [
          { id: 1, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 2, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 3, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 4, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 5, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 6, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 7, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 8, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 9, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 10, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 11, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 12, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 13, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
          { id: 14, err: 'Something went wrong while processing your request', document: '\\JDJDN01\file01.pdf' },
        ],
        articles: {
            approved: [
            { id: 1, title: 'Artikel A55FG90', date: Moment().format('DD-MM-YYYY') },
            { id: 2, title: 'Artikel A55FG91', date: Moment().format('DD-MM-YYYY') },
            { id: 3, title: 'Artikel A55FG92', date: Moment().format('DD-MM-YYYY') },
            { id: 4, title: 'Artikel A55FG93', date: Moment().format('DD-MM-YYYY') },
            { id: 5, title: 'Artikel A55FG94', date: Moment().format('DD-MM-YYYY') },
            ],
            unapproved: [
            { id: 1, title: 'Artikel HGR41100', date: Moment().format('DD-MM-YYYY') },
            { id: 2, title: 'Artikel HGR41101', date: Moment().format('DD-MM-YYYY') },
            { id: 3, title: 'Artikel HGR41102', date: Moment().format('DD-MM-YYYY') },
            { id: 4, title: 'Artikel HGR41103', date: Moment().format('DD-MM-YYYY') },
            { id: 5, title: 'Artikel HGR41104', date: Moment().format('DD-MM-YYYY') },
            ],
            expired: [
            { id: 1, title: 'Artikel KRLOO600', date: Moment().format('DD-MM-YYYY') },
            { id: 2, title: 'Artikel KRLOO601', date: Moment().format('DD-MM-YYYY') },
            { id: 3, title: 'Artikel KRLOO602', date: Moment().format('DD-MM-YYYY') },
            { id: 4, title: 'Artikel KRLOO603', date: Moment().format('DD-MM-YYYY') },
            { id: 5, title: 'Artikel KRLOO604', date: Moment().format('DD-MM-YYYY') },
            ],
        },
        files: [
          { id: 1, name: `${Moment().format('YYYY-MM-DD')}-certificate-0067RF.pdf`, selected: false },
          { id: 2, name: `${Moment().format('YYYY-MM-DD')}-certificate-0067RF.pdf`, selected: false },
          { id: 3, name: `${Moment().format('YYYY-MM-DD')}-certificate-0067RF.pdf`, selected: false },
        ],
    };

    onScheduledStartChanged = (e) => {
        this.state.scheduledStartChecked = e.target.checked;
        this.setState(this.state);
    };

    onControlStart = () => {
        this.state.running = true;
        this.setState(this.state);
    };

    onControlStop = () => {
        this.state.running = false;
        this.setState(this.state);
    };

    onLogTabsChange = (event, value) => {
        this.state.activeLogsTab = value;
        this.setState(this.state);
    };

    onFileSelectChange = (checked, index) => {
        this.state.files[index].selected = checked;
        this.setState(this.state);
    };

    onFileDelete = (index) => {
        this.state.files.splice(index, 1);
        this.setState(this.state);
    };

    onProcessFilesClick = () => {
        this.state.files = [];
        this.setState(this.state);
    };

    render() {
        return (
            <div className="App">
                <AppBar position="static">
                    <Toolbar>
                        <Typography type="title" color="inherit">
                          J de Jonge certificaten
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Grid container spacing={0}>
                    <Grid item xs={4}>
                        <ControlProcess
                            onStart={this.onControlStart}
                            onStop={this.onControlStop}
                            onScheduledStartChanged={this.onScheduledStartChanged}
                            running={this.state.running}
                            scheduledStartChecked={this.state.scheduledStartChecked} />
                        <Status running={this.state.running} />
                    </Grid>
                    <Grid item xs={8}>
                        <FileManager
                            files={this.state.files}
                            onSelectChange={this.onFileSelectChange}
                            onDelete={this.onFileDelete}
                            onProcessFilesClick={this.onProcessFilesClick} />
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <ViewLogs
                        errors={this.state.errors}
                        articles={this.state.articles}
                        value={this.state.activeLogsTab}
                        onTabsChange={this.onLogTabsChange} />
                </Grid>
            </div>
        );
    }
}

export default App;
