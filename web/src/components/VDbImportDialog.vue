<template>
    <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin ace-preferences-dialog" style="min-width: 600px; max-width: 800px;">
        <q-bar>
            <q-icon name="download"></q-icon>
            <h6 :style="{'margin':'10px'}">Import {{ props.id }}</h6>
        </q-bar>
        <q-form @submit="onOKClick" @reset="resetForm">
        <q-card-section>
            <div class="q-gutter-y-md">
                <!-- SQL Import: Show textarea for pasting code -->
                <div v-if="isSqlImport">
                    <q-input
                        v-model="sqlCode"
                        type="textarea"
                        filled
                        :label="`Paste ${props.id.toUpperCase()} code`"
                        :placeholder="sqlPlaceholder"
                        rows="12"
                        class="q-mb-md"
                    />
                    
                    <q-toggle
                        v-model="appendMode"
                        label="Append converted DBML to the end"
                        color="primary"
                        class="q-mb-md"
                    />
                    
                    <q-input
                        v-model="newFileName"
                        type="string"
                        filled
                        :label="`File name`"
                        :hint="appendMode ? 'Current file will be updated' : 'New file will be created'"
                        :disable="appendMode"
                    /> 
                </div>

                <!-- Non-SQL Import: Keep original file upload -->
                <div v-else>
                    <q-file class="col-md-4 col-lg-3"
                         v-model="imprtFile"
                    
                         :label="`Browse file`"
                         :accept="acceptFiles()"
                         @input="fileChange"
                         @rejected="onRejected">
                         <template v-slot:prepend>
                            <q-icon name="attach_file" />
                        </template>     
                    </q-file>
                  
                    <q-input class="col-md-4 col-lg-3"
                         v-model="newFileName"
                         type="string"
                         stack-label
                         :label="`Change file name`"
                    /> 
                </div>
            </div>
        </q-card-section>
        
       
        <q-card-actions align="right">
            <q-btn flat color="primary" label="Cancel" @click="onDialogCancel" />
            <q-btn flat color="primary" type="submit" label="Import"/>
          </q-card-actions>
        </q-form>
    </q-card>
    </q-dialog>
    </template>
    <script setup>
    import { useDialogPluginComponent, useQuasar } from 'quasar';
    import { computed, defineProps,ref } from 'vue';
    import { useFilesStore } from '../store/files';
    import localforage from "localforage";
    const { importer } = require('@dbml/core');
    import { useChartStore } from '../store/chart';
    import { useEditorStore } from '../store/editor';

    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    
    const fstore = useFilesStore();
    const filesfs = localforage.createInstance({
        name: "dbdiagram-oss",
        storeName: "files"
    });
    const $q = useQuasar();

    const props = defineProps({
    id: {
      type: String,
      required: true
    },
    ext: {
      type: String,
      required: true
    }
    
  })
  const imprtFile = ref(null);
  const newFileName = ref()
  const sqlCode = ref('')
  const appendMode = ref(false)

  // Check if this is a SQL import (postgres, mysql, mssql)
  const isSqlImport = computed(() => {
    return ['postgres', 'mysql', 'mssql'].includes(props.id)
  })

  // SQL placeholder text based on the import type
  const sqlPlaceholder = computed(() => {
    const examples = {
      postgres: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT
);`,
      mysql: `CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`,
      mssql: `CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(50) NOT NULL,
  email NVARCHAR(100) UNIQUE,
  created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE posts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT FOREIGN KEY REFERENCES users(id),
  title NVARCHAR(200) NOT NULL,
  content NVARCHAR(MAX)
);`
    }
    return examples[props.id] || 'CREATE TABLE ...'
  })

  const acceptFiles = () => {
    return `.${props.ext}`;
  }

  defineEmits([
    ...useDialogPluginComponent.emits
  ]);

 

  /*const checkType = (files) => {
    return files.filter(file => file.type === 'application/json' || file.type === 'text/plain')
  }*/

  const onRejected = (rejectedEntries) => {
        // Notify plugin needs to be installed
        // https://quasar.dev/quasar-plugins/notify#Installation
        $q.notify({
          type: 'negative',
          message: `${rejectedEntries.length} file(s) did not pass validation constraints, wrong type`
        })
      };

      function parseFilename(name){
        name = name.split('\\').pop();
        return {
            name: name.substring(0,name.lastIndexOf('.')),
            extension: name.split('.').pop()
        }
      }

      function saveAndLoadFile(file, option){
                
        getFileContent(file,(value)=>{
            console.log(newFileName.value);
            let err = null;
            if (value.error != null) {
                    $q.notify({
                        caption:"Import",
                        message:`${imprtFile.value.name} ${value.error}`,
                        multiLine:true,
                        color: 'red',
                        icon: 'warning',
                        position: "bottom-right"
                    })
                } else {
                    if (option == 'R') {
                        if (props.id != 'json') {
                            try {
                                const dbmlData = importer.import(value.data, props.id);
                                filesfs.getItem(newFileName.value).then((error, val)=>{
                                if (error == null) {
                                    val.source.text = dbmlData
                                    filesfs.setItem(newFileName.value,val).then(()=>{
                                        fstore.loadFile(newFileName.value);
                                    })
                                }
                                $q.notify({
                                    caption:"Import",
                                    message:`File ${newFileName.value} replaced`,
                                    multiLine:true, 
                                    color: 'green',
                                    icon: 'upload',
                                    position: "bottom-right"
                                })
                            })
                            } catch(error){
                                err = error
                                $q.notify({
                                    caption:"Import > "+error.name,
                                    html:true,
                                    message:`<div> <span>Import file [${newFileName.value}] error occured, founded: ${error.found} </span> 
                                            <div>
                                            <div>Start line: ${error.location.start.line}, column: ${error.location.start.column} </div>
                                            <div>End line: ${error.location.end.line}, column: ${error.location.end.column} </div>
                                            </div>
                                            <p>${error.message}</p> Open console for more information </div>`,
                                    multiLine:true,
                                    color: 'red',
                                    icon: 'warning',
                                    progress:true,
                                    position: "bottom-right",
                                    timeout:10000,
                                })
                                console.error("IMPORT ERROR",error)
                            }
                            
                            
                        } else {
                            filesfs.setItem(newFileName.value,value.data).then(()=>{
                                fstore.loadFile(newFileName.value);
                            })
                            $q.notify({
                                caption:"Import",
                                message:`File ${newFileName.value} replaced`,
                                multiLine:true, 
                                color: 'green',
                                icon: 'upload',
                                position: "bottom-right"
                            })
                        }
                       
                       
                    }
                    if (option == 'SC') {
                        let copyIndex=0
                        let newname = newFileName.value;
                        while (fstore.getFiles.includes(newname)){
                            newname = newname+"_copy"+copyIndex;
                            copyIndex++;
                        }
                        if (props.id != 'json') {
                            try {
                                const editor = useEditorStore();
                                const dbmlData = importer.import(value.data, props.id);
                                fstore.newImportFile(newname)
                                editor.updateSourceText(dbmlData)
                                $q.notify({
                                    caption:"Import",
                                    message:`File copy ${newFileName.value} saved`,
                                    multiLine:true,
                                    color: 'green',
                                    icon: 'upload',
                                    position: "bottom-right"
                                })
                            } catch(error) {
                                err = error
                                $q.notify({
                                    caption:"Import > "+error.name,
                                    html:true,
                                    message:`<div> <span>Import file [${newFileName.value}] error occured, founded: ${error.found} </span> 
                                            <div>
                                            <div>Start line: ${error.location.start.line}, column: ${error.location.start.column} </div>
                                            <div>End line: ${error.location.end.line}, column: ${error.location.end.column} </div>
                                            </div>
                                            <p>${error.message}</p> Open console for more information </div>`,
                                    multiLine:true,
                                    color: 'red',
                                    icon: 'warning',
                                    progress:true,
                                    position: "bottom-right",
                                    timeout:10000,
                                })
                                console.error("IMPORT ERROR",error)
                            }
                            
                        } else {
                            filesfs.setItem(newname,value.data).then(()=>{
                                fstore.loadFile(newname);
                             })
                             $q.notify({
                                caption:"Import",
                                message:`File copy ${newFileName.value} saved`,
                                multiLine:true,
                                color: 'green',
                                icon: 'upload',
                                position: "bottom-right"
                            })
                        }
                        
                        
                    }
                    if (option == 'S'){
                        if (props.id != 'json') {
                            try {
                                const editor = useEditorStore();
                                const dbmlData = importer.import(value.data, props.id);
                                fstore.newImportFile(newFileName.value)
                                editor.updateSourceText(dbmlData)
                            } catch (error) {
                                err = error
                                $q.notify({
                                    caption:"Import > "+error.name,
                                    html:true,
                                    message:`<div> <span>Import file [${newFileName.value}] error occured, founded: ${error.found} </span> 
                                            <div>
                                            <div>Start line: ${error.location.start.line}, column: ${error.location.start.column} </div>
                                            <div>End line: ${error.location.end.line}, column: ${error.location.end.column} </div>
                                            </div>
                                            <p>${error.message}</p> Open console for more information </div>`,
                                    multiLine:true,
                                    color: 'red',
                                    icon: 'warning',
                                    progress:true,
                                    position: "bottom-right",
                                    timeout:10000,
                                })
                                console.error("IMPORT ERROR",error)
                            }
                            
                        } else {
                            filesfs.setItem(newFileName.value,value.data).then(()=>{
                                fstore.loadFile(newFileName.value);
                            })
                        }
                       
                    }
                    if (err == null) {
                        $q.notify({
                            caption:"Import",
                            message:`File ${newFileName.value} imported`,
                            multiLine:true,
                            color: 'green',
                            icon: 'upload',
                            position: "bottom-right"
                        })
                    }
                    

                    onDialogOK();
                }
        });
      }

      function getFileContent(file, callback) {

        function readFile(callback) {
            let reader = new FileReader();
            reader.addEventListener('load', (e)=>{
                let text = reader.result;
                let err = null
                let filedata = text;
                if (props.id == 'json'){
                    let obj = JSON.parse(text);
                    if (obj.source != undefined && obj.preferences != undefined && obj.chart != undefined) {
                        filedata = obj;
                    } else {
                        err = "The file structure is incompatible with the application"
                    }
                }
                let res = {data: filedata, error: err}
                callback(res)
            })
            reader.readAsText(file);
        }
        
        readFile(callback);

        }

      function onOKClick () {
        // Handle SQL paste import
        if (isSqlImport.value && sqlCode.value.trim()) {
            try {
                const editor = useEditorStore();
                const dbmlData = importer.import(sqlCode.value, props.id);
                
                if (appendMode.value) {
                    // Append to current file
                    const currentText = editor.getSourceText;
                    const newText = currentText + '\n\n' + dbmlData;
                    editor.updateSourceText(newText);
                    
                    $q.notify({
                        caption: "Import",
                        message: `SQL code converted and appended to current file`,
                        multiLine: true,
                        color: 'green',
                        icon: 'upload',
                        position: "bottom-right"
                    });
                    
                    onDialogOK();
                } else {
                    // Create new file
                    if (!newFileName.value || newFileName.value.trim() === '') {
                        $q.notify({
                            caption: "Import",
                            message: `Please enter a file name`,
                            multiLine: true,
                            color: 'red',
                            icon: 'warning',
                            position: "bottom-right"
                        });
                        return;
                    }
                    
                    if (fstore.getFiles.includes(newFileName.value)) {
                        $q.notify({
                            caption: "Import",
                            message: `File ${newFileName.value} already exists`,
                            multiLine: true,
                            color: 'red',
                            icon: 'warning',
                            position: "bottom-right"
                        });
                        return;
                    }
                    
                    fstore.newImportFile(newFileName.value);
                    editor.updateSourceText(dbmlData);
                    
                    $q.notify({
                        caption: "Import",
                        message: `File ${newFileName.value} created from SQL code`,
                        multiLine: true,
                        color: 'green',
                        icon: 'upload',
                        position: "bottom-right"
                    });
                    
                    onDialogOK();
                }
            } catch (error) {
                $q.notify({
                    caption: "Import > " + (error.name || 'Error'),
                    html: true,
                    message: `<div> <span>Import SQL code error occurred${error.found ? ', founded: ' + error.found : ''} </span> 
                            ${error.location ? `<div>
                            <div>Start line: ${error.location.start.line}, column: ${error.location.start.column} </div>
                            <div>End line: ${error.location.end.line}, column: ${error.location.end.column} </div>
                            </div>` : ''}
                            <p>${error.message || 'Unknown error'}</p> Open console for more information </div>`,
                    multiLine: true,
                    color: 'red',
                    icon: 'warning',
                    progress: true,
                    position: "bottom-right",
                    timeout: 10000,
                });
                console.error("IMPORT ERROR", error);
            }
            return;
        }
        
        // Handle file upload import (original logic)
        if (imprtFile.value != null) {

            let fl = parseFilename(imprtFile.value.name)
                        
            if (fstore.getFiles.includes(newFileName.value)) {
                $q.notify({
                    caption:"Import",
                    message:`File ${newFileName.value} already exists`,
                    multiLine:true,
                    color: 'indigo-7',
                    icon: 'upload',
                    position: "center",
                    actions:[
                        { label:'Replace', color:'red', handler:()=>{saveAndLoadFile(imprtFile.value,'R')}},
                        { label:'Save copy', color:'green', handler:()=>{saveAndLoadFile(imprtFile.value,'SC')}},
                        { label:'Dismiss', color:'grey', handler:()=>{ 
                            $q.notify({
                                caption:"Import",
                                message:`${newFileName.value} not saved`,
                                multiLine:true,
                                color: 'red',
                                icon: 'warning',
                                position: "bottom-right"
                            })}},
                    ]
                })
            } else {
                saveAndLoadFile(imprtFile.value,'S')
               
                onDialogOK();
            }
                
            
        } else {
            $q.notify({
                    caption:"Import",
                    message: isSqlImport.value ? `Please paste SQL code or select a file` : `File not selected`,
                    multiLine:true,
                    color: 'red',
                    icon: 'warning',
                    position: "bottom-right"
                })
        }
        
       
      }

    function fileChange(evt){
        console.log(evt.target)
        console.log(evt.target.value)
        let data = parseFilename(evt.target.value)
        newFileName.value = data.name;
    }
   
    function resetForm() {
        imprtFile.value = null;
        sqlCode.value = '';
        appendMode.value = false;
    }


    </script>