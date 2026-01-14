import { defineStore } from "pinia";
import { useEditorStore } from "src/store/editor";
import { useChartStore } from "src/store/chart";
import { useRepoStore } from "./repo";


import localforage from "localforage";

const fs = localforage.createInstance({
  name: "dbdiagram-oss",
  storeName: "files"
});

const EXAMPLE_DBML = `// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  email varchar
  role varchar
  created_at timestamp
}

Table profiles {
  id integer [primary key]
  user_id integer [not null]
  display_name varchar
  bio text [note: 'Public profile description']
  created_at timestamp
}

Table posts as P {
  id integer [primary key]
  user_id integer [not null]
  title varchar
  body text [note: 'Main post content']
  status varchar
  created_at timestamp
}

Table comments {
  id integer [primary key]
  post_id integer [not null]
  user_id integer [not null]
  body text
  created_at timestamp
}

Table follows {
  following_user_id integer
  followed_user_id integer
  created_at timestamp
}

Table jobs {
  id integer [primary key]
  user_id integer
  status job_status
  created_at timestamp
}

Table "AuditLogs" [headercolor:#884400] {
  "LogID" integer
  "Entity" varchar
  "EntityID" integer
  "Action" varchar
  "CreatedAt" timestamp
}

Ref user_profile: profiles.user_id > users.id // many-to-one
Ref user_posts: P.user_id > users.id // many-to-one
Ref post_comments: comments.post_id > P.id // many-to-one
Ref comment_author: comments.user_id > users.id // many-to-one
Ref follows_user: follows.following_user_id > users.id
Ref followed_user: follows.followed_user_id > users.id
Ref job_owner: jobs.user_id > users.id

TableGroup Core {
  users
  profiles
  follows
}

TableGroup Content {
  P
  comments
}

TableGroup Operations {
  jobs
  "AuditLogs"
}

enum job_status {
  created [note: 'Waiting to be processed']
  running
  done
  failure
}
`;


export const useFilesStore = defineStore("files", {
  state: () => ({
    saving: false,
    lastSave: 0,
    currentFile: "",
    files: []
  }),
  getters: {
    getFiles(state) {
      return state.files;
    },
    getCurrentFile(state) {
      return state.currentFile;
    }
  },
  actions: {
    loadFileList() {
      console.log("loading file list");

      fs.keys()
        .then(keys => {
          this.files = keys;
        });
      
    },
    loadFile(fileName) {
      this.loadFileList();
      console.log("loading file", fileName);

      fs.getItem(fileName)
        .then(file => {
          if (file && file.source) {
            this.$patch({
              currentFile: fileName
            });
            const editor = useEditorStore();
            const chart = useChartStore();
            
            
            editor.load({
                source: file.source
              });
              chart.load(file.chart || {}); 
          }
        });
    },
    saveFile(fileName) {
      this.saving = true;
      if (!fileName) {
        fileName = this.currentFile;
      }
      if (!fileName) {
        const list = this.files;
        let i = 1;
        fileName = `Untitled (${i})`;

        while (list.indexOf(fileName) >= 0) {
          fileName = `Untitled (${i++})`;
        }
      }
      console.log("saving file", fileName);

      const editor = useEditorStore();
      const chart = useChartStore();

      const file = {
        ...editor.save,
        chart: chart.save
      };

      fs.setItem(fileName, JSON.parse(JSON.stringify(file))).then(() => {
        this.loadFileList();
        this.saving = false;
        this.lastSave = new Date();
        if (this.currentFile !== fileName) {
          this.$patch({
            currentFile: fileName
          });
        }
      });
    },
    newFile() {
      this.$patch({
        currentFile: undefined
      });

      const editor = useEditorStore();
      const chart = useChartStore();

      editor.$reset();
      chart.$reset();
      this.saveFile();
    },
    newImportFile(name) {
      this.$patch({
        currentFile: name
      });

      const editor = useEditorStore();
      const chart = useChartStore();

      editor.$reset();
      chart.$reset();
      this.saveFile();
    },
    deleteFile(fileName) {
      if (!fileName) return;
      fs.removeItem(fileName).then(() => {
        this.loadFileList();
        if (fileName === this.currentFile){
          if (this.files.length > 0){
            this.loadFile(this.files[0]);
          }
        }
        
      });
    },
    renameFile(newName) {
      const oldName = this.currentFile;
      this.saveFile(newName);
      if (oldName !== newName) {
        this.deleteFile(oldName);
        this.currentFile = newName;
      }
      this.loadFileList();
    },
    openExample() {
      this.$patch({
        currentFile: undefined
      });

      const editor = useEditorStore();
      const chart = useChartStore();

      editor.$reset();
      chart.$reset();
      
      // Load the example DBML content
      editor.load({
        source: {
          format: "dbml",
          text: EXAMPLE_DBML
        }
      });
      
      this.saveFile("Example");
    }
  }
});
