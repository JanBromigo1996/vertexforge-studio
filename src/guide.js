/* ============================================================================
   ANLEITUNG in allen App-Sprachen (de, en, fr, es, it, pt)
   Abschnitt: [id, icon, Titel, HTML]  ·  {KEYS} wird durch die Tastenkürzel-Tabelle ersetzt
   ============================================================================ */
const GUIDE = {
de: [
 ['start','compass','Erste Schritte',`
  <p>VertexForge Studio ist dein visueller Produktionsplan für 3D-Projekte – vom ersten Moodboard bis zum finalen Render: Projektbibliothek mit Plakat-Covern, Pipeline mit Deadlines, Denkbrett für Ideen, Referenzen und Medien, Shotlist und ein Schreibtisch mit Welt-Bibel.</p>
  <div class="flow"><span class="st">1 · Projekt anlegen</span>›<span class="st">2 · Pipeline-Vorlage</span>›<span class="st">3 · Referenzen aufs Denkbrett</span>›<span class="st">4 · Dateien verknüpfen</span>›<span class="st">5 · Deadlines abarbeiten</span></div>
  <ol><li><kbd>Strg</kbd>+<kbd>N</kbd> – Namen, Startdatum und eine Pipeline-Vorlage wählen, z. B. „Charakter“.</li>
  <li>Im <b>Cover-Designer</b> Titel, Schrift, 3D-Effekt und Bild festlegen.</li>
  <li>In der <b>Pipeline</b> Termine anpassen und den Aufwand schätzen.</li>
  <li>Auf dem <b>Denkbrett</b> Bilder und Videos einfügen oder Dateien verknüpfen und an Asset-Karten andocken.</li>
  <li>An Asset-Karten deine <b>.blend-, .ztl-, .spp- oder .psd-Dateien</b> hinterlegen.</li></ol>
  <div class="tip">Die <b>geführte Tour</b> erreichst du jederzeit über Hilfe ▸ Geführte Tour. <kbd>F3</kbd> findet jeden Befehl, <kbd>?</kbd> zeigt alle Tastenkürzel.</div>
  <div class="tip"><b>Ohne KI-Kunst:</b> VertexForge plant und organisiert – es erzeugt keine Bilder, Modelle oder Texte und ersetzt keine Künstlerinnen und Künstler. Deine Kunst bleibt deine.</div>`],
 ['projects','grid','Projekte & Bibliothek',`
  <ul><li><b>Öffnen:</b> Cover anklicken. Das aktive Projekt hat einen goldenen Rahmen und steht oben in der Projektauswahl.</li>
  <li><b>Schnellaktionen</b> beim Überfahren, <b>Rechtsklick</b> für alle: gestalten, Bild hochladen, duplizieren, exportieren, löschen.</li>
  <li>Regler <b>„Cover“</b> und <b>„Titel“</b> ändern die Größe der Vorschau, Suche und Sortierung helfen bei vielen Projekten.</li></ul>`],
 ['designer','sliders','Cover-Designer & 3D-Titel',`
  <ul><li><b>Frei verschieben:</b> Titel oder Banner in der Vorschau ziehen – rastet an der Mittellinie ein (<kbd>Alt</kbd> = ohne Raster).</li>
  <li><b>Zeilenumbruch:</b> einfach <kbd>Enter</kbd>. <b>Stil-Vorlagen</b> setzen Schrift, Oberfläche und 3D-Effekt mit einem Klick.</li>
  <li><b>Über 50 Schriften</b> (Fantasy, 3D & Display, Kino, Sci-Fi, Horror, Modern, Handschrift), Oberflächen wie Blattgold, Chrom oder Neon, 3D-Effekte wie Extrusion, Prägung, Glühen.</li>
  <li>Unter „Bild & Theme“ eigenes Render hochladen, Ausschnitt und Vignette einstellen, Genre-Theme wählen.</li></ul>`],
 ['pipeline','calendar','Pipeline, Deadlines & Kanban',`
  <ul><li><b>Kennzahlen:</b> Fortschritt, nächste Deadline, Überfälliges, Kritisches, Projekt-Deadline und Restaufwand pro Tag.</li>
  <li><b>Zeitachse:</b> jede Phase als Balken mit Fortschritt und „Heute“-Linie.</li>
  <li><b>Aufgaben:</b> Status (Offen → In Arbeit → Review → Erledigt), Priorität (Low bis Critical), Aufwand und Deadline mit Live-Countdown.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>): Aufgaben per Drag & Drop zwischen Spalten verschieben.</li>
  <li><b>Vorlage einfügen</b> hängt fertige Phasen an (Charakter, Environment, Hard-Surface, Motion, Kurzfilm).</li></ul>`],
 ['board','network','Denkbrett: Ideen, Karten, Verbindungen',`
  <ul><li><b>Elemente:</b> Knoten, Asset-Karten (mit Stufe von Konzept bis Final und verknüpften Dateien), Notizen, gestaltete Titel, Bilder, Videos und verknüpfte Dateien.</li>
  <li><b>Hinzufügen:</b> Werkzeugleiste links, Rechtsklick auf den Hintergrund oder <kbd>Shift</kbd>+<kbd>A</kbd> an der Mausposition.</li>
  <li><b>Verbinden:</b> vom ●-Punkt rechts auf ein anderes Element ziehen – beliebig viele Verbindungen pro Element. Griff am Kabelende = umhängen oder lösen, <kbd>Strg</kbd>+Rechts-Ziehen schneidet Kabel.</li>
  <li><b>Andocken:</b> Bilder, Videos, Dateien und Titel nahe an eine Asset-Karte ziehen – sie reihen sich ein und wandern mit. <b>Wieder wegziehen</b> (oder schütteln, <kbd>Alt</kbd>+<kbd>P</kbd>) löst sie. <kbd>Strg</kbd>+<kbd>P</kbd> dockt die Auswahl an die aktive Karte.</li>
  <li><b>Navigation (Blender-Stil):</b> Mausrad zoomt, Mitte/Rechts ziehen oder Leertaste verschiebt, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> bewegen/skalieren/löschen, <kbd>Pos1</kbd> passt alles ein, Rechtsklick bricht ab.</li>
  <li><kbd>Strg</kbd> + Mausrad bzw. <kbd>Strg</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> vergrößert die <b>gesamte Oberfläche</b>.</li></ul>`],
 ['media','image','Bilder, Videos & verknüpfte Dateien',`
  <ul><li><b>Bilder:</b> per Drag & Drop, <kbd>Strg</kbd>+<kbd>V</kbd> oder Werkzeug – sie werden platzsparend eingebettet.</li>
  <li><b>Videos</b> (MP4, WebM, MOV …) bis 80 MB werden eingebettet; beim Überfahren spielen sie lautlos an, <b>Doppelklick</b> öffnet die Großansicht mit Ton und Steuerung.</li>
  <li><b>Datei verknüpfen:</b> verweist auf eine Datei auf deinem PC, ohne sie zu kopieren – ideal für große Videos, Renderings oder .blend-Dateien. In der Desktop-App siehst du Bilder und Videos direkt als Vorschau; Öffnen und „Im Ordner zeigen“ sind ein Klick. Auch ein eingefügter Pfad (<kbd>Strg</kbd>+<kbd>V</kbd>) wird verknüpft.</li>
  <li>Fehlt eine verknüpfte Datei, wird der Pfad rot markiert.</li></ul>`],
 ['designs','palette','Designs für jeden Bereich',`
  <ul><li><b>Denkbrett:</b> Über die Palette oben rechts bekommt jedes Brett sein eigenes Aussehen – <b>Studio</b>, <b>Pinnwand</b> (Kork, Notizzettel mit Pins, rote Fäden), <b>Skizzenbuch</b>, <b>Blaupause</b>, <b>Kreidetafel</b> oder <b>Glas</b>. Hintergrund und Knoten-Stil lassen sich auch einzeln kombinieren.</li>
  <li><b>Story:</b> Papier & Schrift – Pergament, Klar, Manuskript, Schreibmaschine oder Nacht.</li>
  <li><b>Vollbild nur für die Arbeitsfläche:</b> Denkbrett und Story lassen sich mit dem Pfeil-Symbol oder <kbd>F11</kbd> bildschirmfüllend nutzen – <kbd>Esc</kbd> beendet.</li>
  <li>Hell/Dunkel und Genre-Theme gelten für die ganze App.</li></ul>`],
 ['software','folder','Software & Dateipfade',`
  <p>Asset-Karten und Welt-Bibel-Einträge speichern Pfade zu deinen Arbeitsdateien. Das Programm wird an der Endung erkannt: .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject und viele mehr.</p>
  <table><tr><th></th><th>Desktop-App</th><th>Browser</th></tr>
  <tr><td>Klick aufs Badge</td><td>öffnet die Datei im passenden Programm</td><td>kopiert den Pfad</td></tr>
  <tr><td>Durchsuchen</td><td>Dateidialog des Systems</td><td>Pfad einfügen</td></tr>
  <tr><td>Programm-Icons</td><td>Icons der installierten Programme</td><td>Farbcodes / eigene Icons</td></tr></table>
  <div class="tip">Unter <b>Einstellungen → Software-Bibliothek</b> passt du Farben, Kürzel und Endungen an oder fügst Programme hinzu.</div>`],
 ['shots','film','Shotlist',`
  <ul><li>Jeder Shot hat ID, Storyboard-Bild, Sequenz, Handlung, Frames, Linse und VFX-Notiz; Dauer und Gesamtlaufzeit werden aus der Bildrate berechnet.</li>
  <li>Department-Status LAY · ANI · CFX · LGT · RND per Klick: TODO → WIP → DONE.</li>
  <li><b>Reihenfolge ändern:</b> am Griff rechts ziehen (Rechtsklick/Esc bricht ab) oder beim Tippen <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>.</li></ul>`],
 ['story','book','Story & Lore',`
  <ul><li>Links Szenen und Welt-Bibel, in der Mitte das Papier, rechts der Asset-Inspektor.</li>
  <li>Format-Knöpfe fügen Szenenkopf, Figur, Kamera und Schnitt ein; Namen aus der Welt-Bibel werden im Text erkannt.</li>
  <li><b>Fokusmodus</b> (<kbd>Strg</kbd>+<kbd>Leertaste</kbd>) blendet die Seitenleisten aus, <b>Vollbild</b> (<kbd>F11</kbd>) zusätzlich alles andere.</li></ul>`],
 ['save','download','Speichern, Versionen & Backup',`
  <ul><li><b>Automatisch:</b> Jede Änderung wird sofort lokal gesichert.</li>
  <li><b>Projektdatei (.vforge):</b> Diskette oben rechts bzw. <kbd>Strg</kbd>+<kbd>S</kbd>; <kbd>Strg</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> unter neuem Namen; <b>inkrementell</b> (<kbd>Strg</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>) legt wie Blender <i>_v02</i>, <i>_v03</i> … an.</li>
  <li><b>Versionen</b> (Uhr-Symbol, <kbd>Strg</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>): automatisch alle 10 Minuten, bei jedem Speichern, vor dem Öffnen, Wiederherstellen und vor jedem Update. Benannte Version mit <kbd>Strg</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>. Wiederherstellen, als Kopie öffnen, exportieren oder behalten.</li>
  <li><b>PC ↔ Laptop:</b> .vforge-Datei in einen Cloud-Ordner legen und dort öffnen oder importieren.</li></ul>
  <div class="tip">Im Browser gehen die Daten verloren, wenn du die Browser-Daten löschst – sichere wichtige Stände als .vforge-Datei.</div>`],
 ['team','users','Im Team arbeiten',`
  <p>Mehrere Personen – oder du an mehreren Computern – arbeiten am selben Projekt, <b>ohne Server und ohne Konto</b>. Das Projekt liegt dazu in einem Ordner, den ihr ohnehin teilt: OneDrive, Dropbox, Google Drive, Nextcloud oder ein Netzlaufwerk.</p>
  <ol><li><b>Datei ▸ Im Team-Ordner teilen …</b> – geteilten Ordner wählen. Darin entsteht „Projektname.vforge-team“.</li>
  <li>Alle anderen: <b>Datei ▸ Team-Projekt öffnen …</b> und genau diesen Ordner wählen.</li>
  <li>Oben neben dem Projektnamen zeigt <b>Team</b> den Status und wer gerade mitarbeitet.</li></ol>
  <p>Jede Aufgabe, Karte, jeder Shot und jedes Kapitel ist eine eigene kleine Datei. Ändern zwei Leute <i>verschiedene</i> Dinge, wird alles automatisch zusammengeführt. Ändern beide <i>dasselbe</i> gleichzeitig, gilt deine Fassung – die andere bleibt im Unterordner „conflicts“ erhalten. Abgeglichen wird alle paar Sekunden; wie schnell es bei den anderen ankommt, hängt vom Cloud-Dienst ab.</p>
  <div class="tip">Ist der Ordner kurz nicht erreichbar (offline, Laptop unterwegs), arbeitest du einfach lokal weiter – beim nächsten Kontakt wird abgeglichen. Team-Ordner funktionieren in der Desktop-App (Windows, macOS, Linux) sowie in Chrome und Edge am Computer.</div>`],
 ['install','download','Installation & Updates',`
  <ul><li><b>Windows:</b> „VertexForge Studio Setup.exe“ starten, Sprache und Zielordner wählen – Desktop- und Startmenü-Verknüpfung werden angelegt.</li>
  <li><b>macOS:</b> DMG öffnen und die App in „Programme“ ziehen. Beim ersten Start: Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen“ (die App ist nicht von Apple notarisiert).</li>
  <li><b>Linux:</b> das .deb per Doppelklick bzw. <code>sudo apt install ./VertexForge-Studio-linux-amd64.deb</code> installieren – oder das .tar.gz entpacken und <code>./install.sh</code> ausführen.</li>
  <li><b>Updates:</b> einfach das neue Setup ausführen. Deine Projekte liegen getrennt vom Programm in deinem Benutzerprofil und werden <b>nie überschrieben</b>; vor jedem Update entsteht automatisch eine Sicherheits-Version, und ältere Daten werden verlustfrei übernommen.</li>
  <li><b>Entfernen:</b> Windows „Apps & Features“, macOS App in den Papierkorb, Linux <code>sudo apt remove vertexforge-studio</code> bzw. <code>./install.sh --uninstall</code>. Deine Projekte bleiben erhalten.</li></ul>`],
 ['settings','sliders','Sprache & Einstellungen',`
  <ul><li><b>Sprache:</b> Deutsch, English, Français, Español, Italiano, Português – in der Statusleiste oder in den Einstellungen.</li>
  <li><b>Fenster:</b> unter Windows eigene Titelleiste (ziehen, Doppelklick maximiert), unter macOS und Linux die gewohnte Fensterleiste; <kbd>F11</kbd> Vollbild.</li>
  <li><b>Daten:</b> Beispielprojekte laden, Backup exportieren, Projekte oder alles zurücksetzen.</li></ul>`],
 ['keys','keyboard','Alle Tastenkürzel','{KEYS}'],
 ['faq','compass','Fragen & Lösungen',`
  <ul><li><b>Die App startet nicht (Windows):</b> Sie braucht die Microsoft Edge WebView2 Runtime (in Windows 10/11 meist vorhanden). Die Fehlermeldung nennt den genauen Grund und den Ort der Log-Datei.</li>
  <li><b>Die App startet nicht (Linux):</b> WebKitGTK fehlt – <code>sudo apt install libwebkit2gtk-4.1-0</code> (Fedora: <code>webkit2gtk4.1</code>).</li>
  <li><b>SmartScreen / Gatekeeper warnt:</b> Die App ist nicht kostenpflichtig signiert – Windows: „Weitere Informationen → Trotzdem ausführen“, macOS: Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen“.</li>
  <li><b>Wo liegen meine Daten?</b> Windows: %LOCALAPPDATA%\\VertexForge Studio · macOS: ~/Library/Application Support/VertexForge Studio · Linux: ~/.local/share/vertexforge-studio · Browser: im Speicher des Browsers.</li>
  <li><b>Verknüpfte Videos zeigen keine Vorschau:</b> Vorschauen von Dateien auf dem PC gibt es nur in der Desktop-App; im Browser bleiben Öffnen/Kopieren.</li></ul>`]
],
en: [
 ['start','compass','Getting started',`
  <p>VertexForge Studio is your visual production plan for 3D projects – from the first mood board to the final render: a project library with poster covers, a pipeline with deadlines, a board for ideas, references and media, a shot list and a writing desk with a world bible.</p>
  <div class="flow"><span class="st">1 · Create project</span>›<span class="st">2 · Pipeline template</span>›<span class="st">3 · References on the board</span>›<span class="st">4 · Link files</span>›<span class="st">5 · Work through deadlines</span></div>
  <ol><li><kbd>Ctrl</kbd>+<kbd>N</kbd> – choose a name, start date and a pipeline template such as “Character”.</li>
  <li>Set title, font, 3D effect and image in the <b>cover designer</b>.</li>
  <li>Adjust dates in the <b>pipeline</b> and estimate effort.</li>
  <li>Add images and videos to the <b>board</b> or link files and dock them to asset cards.</li>
  <li>Store your <b>.blend, .ztl, .spp or .psd files</b> on asset cards.</li></ol>
  <div class="tip">Replay the <b>guided tour</b> any time via Help ▸ Guided tour. <kbd>F3</kbd> finds any command, <kbd>?</kbd> lists all shortcuts.</div>
  <div class="tip"><b>No AI art:</b> VertexForge plans and organises – it generates no images, models or texts and never replaces artists. Your art stays yours.</div>`],
 ['projects','grid','Projects & library',`
  <ul><li><b>Open:</b> click a cover. The active project has a gold frame and is shown in the project selector at the top.</li>
  <li><b>Quick actions</b> on hover, <b>right-click</b> for all of them: design, upload image, duplicate, export, delete.</li>
  <li>The <b>“Cover”</b> and <b>“Title”</b> sliders change the preview size; search and sorting help with many projects.</li></ul>`],
 ['designer','sliders','Cover designer & 3D titles',`
  <ul><li><b>Move freely:</b> drag the title or banner in the preview – it snaps to the center line (<kbd>Alt</kbd> = no snapping).</li>
  <li><b>Line breaks:</b> just press <kbd>Enter</kbd>. <b>Style presets</b> set font, surface and 3D effect in one click.</li>
  <li><b>50+ fonts</b> (fantasy, 3D & display, cinema, sci-fi, horror, modern, handwriting), surfaces like gold leaf, chrome or neon, 3D effects like extrusion, emboss, glow.</li>
  <li>Under “Image & theme” upload your own render, set crop and vignette, and pick the genre theme.</li></ul>`],
 ['pipeline','calendar','Pipeline, deadlines & kanban',`
  <ul><li><b>Key figures:</b> progress, next deadline, overdue, critical, project deadline and remaining effort per day.</li>
  <li><b>Timeline:</b> every phase as a bar with progress and a “today” line.</li>
  <li><b>Tasks:</b> status (open → in progress → review → done), priority (Low to Critical), effort and deadline with a live countdown.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>): drag tasks between columns.</li>
  <li><b>Insert template</b> appends ready-made phases (character, environment, hard surface, motion, short film).</li></ul>`],
 ['board','network','Board: ideas, cards, connections',`
  <ul><li><b>Items:</b> nodes, asset cards (with a stage from concept to final and linked files), notes, styled titles, images, videos and linked files.</li>
  <li><b>Add:</b> tool bar on the left, right-click the background or <kbd>Shift</kbd>+<kbd>A</kbd> at the mouse position.</li>
  <li><b>Connect:</b> drag from the ● dot on the right onto another item – as many connections per item as you like. The handle at a wire end reconnects or removes it, <kbd>Ctrl</kbd>+right-drag cuts wires.</li>
  <li><b>Docking:</b> drag images, videos, files and titles close to an asset card – they line up and move with it. <b>Drag them away</b> again (or shake, <kbd>Alt</kbd>+<kbd>P</kbd>) to undock. <kbd>Ctrl</kbd>+<kbd>P</kbd> docks the selection to the active card.</li>
  <li><b>Navigation (Blender style):</b> wheel zooms, middle/right drag or Space pans, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> move/scale/delete, <kbd>Home</kbd> frames everything, right-click cancels.</li>
  <li><kbd>Ctrl</kbd> + wheel or <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> scales the <b>whole interface</b>.</li></ul>`],
 ['media','image','Images, videos & linked files',`
  <ul><li><b>Images:</b> drag & drop, <kbd>Ctrl</kbd>+<kbd>V</kbd> or the tool – they are embedded efficiently.</li>
  <li><b>Videos</b> (MP4, WebM, MOV …) up to 80 MB are embedded; they play silently on hover, <b>double-click</b> opens the large view with sound and controls.</li>
  <li><b>Link a file:</b> points to a file on your PC without copying it – ideal for big videos, renders or .blend files. The desktop app shows images and videos as live previews; open and “Show in folder” are one click away. A pasted path (<kbd>Ctrl</kbd>+<kbd>V</kbd>) is linked, too.</li>
  <li>If a linked file is missing, its path turns red.</li></ul>`],
 ['designs','palette','Designs for every area',`
  <ul><li><b>Board:</b> the palette at the top right gives each board its own look – <b>Studio</b>, <b>Pinboard</b> (cork, pinned sticky notes, red strings), <b>Sketchbook</b>, <b>Blueprint</b>, <b>Chalkboard</b> or <b>Glass</b>. Background and node style can also be mixed separately.</li>
  <li><b>Story:</b> paper & type – parchment, clean, manuscript, typewriter or night.</li>
  <li><b>Fullscreen for the canvas only:</b> board and story fill the screen via the arrow icon or <kbd>F11</kbd> – <kbd>Esc</kbd> exits.</li>
  <li>Light/dark and the genre theme apply to the whole app.</li></ul>`],
 ['software','folder','Software & file paths',`
  <p>Asset cards and world-bible entries store paths to your working files. The program is detected by extension: .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject and many more.</p>
  <table><tr><th></th><th>Desktop app</th><th>Browser</th></tr>
  <tr><td>Badge click</td><td>opens the file in its program</td><td>copies the path</td></tr>
  <tr><td>Browse</td><td>system file dialog</td><td>paste the path</td></tr>
  <tr><td>Program icons</td><td>icons of installed programs</td><td>color codes / your own icons</td></tr></table>
  <div class="tip">In <b>Settings → Software library</b> you adjust colors, codes and extensions or add programs.</div>`],
 ['shots','film','Shot list',`
  <ul><li>Each shot has an ID, storyboard image, sequence, action, frames, lens and VFX note; duration and total runtime come from the frame rate.</li>
  <li>Department status LAY · ANI · CFX · LGT · RND by click: TODO → WIP → DONE.</li>
  <li><b>Reorder:</b> drag the handle on the right (right-click/Esc cancels) or press <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> while typing.</li></ul>`],
 ['story','book','Story & lore',`
  <ul><li>Scenes and world bible on the left, the paper in the middle, the asset inspector on the right.</li>
  <li>Format buttons insert scene heading, character, camera and cut; names from the world bible are detected in the text.</li>
  <li><b>Focus mode</b> (<kbd>Ctrl</kbd>+<kbd>Space</kbd>) hides the side panels, <b>fullscreen</b> (<kbd>F11</kbd>) everything else too.</li></ul>`],
 ['save','download','Saving, versions & backup',`
  <ul><li><b>Automatic:</b> every change is saved locally right away.</li>
  <li><b>Project file (.vforge):</b> the floppy at the top right or <kbd>Ctrl</kbd>+<kbd>S</kbd>; <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> under a new name; <b>incremental</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>) writes <i>_v02</i>, <i>_v03</i> … like Blender.</li>
  <li><b>Versions</b> (clock icon, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>): automatically every 10 minutes, on every save, before opening, restoring and before every update. Named version with <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>. Restore, open as a copy, export or keep.</li>
  <li><b>PC ↔ laptop:</b> keep the .vforge file in a cloud folder and open or import it there.</li></ul>
  <div class="tip">In the browser, clearing browser data deletes your data – keep important states as .vforge files.</div>`],
 ['team','users','Working as a team',`
  <p>Several people – or you on several computers – work on the same project <b>without a server or an account</b>. The project lives in a folder you already share: OneDrive, Dropbox, Google Drive, Nextcloud or a network drive.</p>
  <ol><li><b>File ▸ Share in a team folder…</b> – choose the shared folder. A “Project name.vforge-team” folder is created inside.</li>
  <li>Everyone else: <b>File ▸ Open team project…</b> and choose exactly that folder.</li>
  <li><b>Team</b> next to the project name shows the status and who is working right now.</li></ol>
  <p>Every task, card, shot and chapter is its own small file. When two people change <i>different</i> things, everything is merged automatically. When both change <i>the same</i> thing at the same moment, your version wins – the other one is kept in the “conflicts” subfolder. Syncing happens every few seconds; how fast it reaches the others depends on the cloud service.</p>
  <div class="tip">If the folder is briefly unreachable (offline, laptop on the road), just keep working locally – it syncs on the next contact. Team folders work in the desktop app (Windows, macOS, Linux) and in Chrome or Edge on a computer.</div>`],
 ['install','download','Installation & updates',`
  <ul><li><b>Windows:</b> run “VertexForge Studio Setup.exe”, choose language and folder – desktop and Start menu shortcuts are created.</li>
  <li><b>macOS:</b> open the DMG and drag the app into “Applications”. First start: System Settings → Privacy & Security → “Open Anyway” (the app is not notarised by Apple).</li>
  <li><b>Linux:</b> install the .deb by double-click or <code>sudo apt install ./VertexForge-Studio-linux-amd64.deb</code> – or unpack the .tar.gz and run <code>./install.sh</code>.</li>
  <li><b>Updates:</b> just run the new setup. Your projects live separately from the program in your user profile and are <b>never overwritten</b>; a safety version is created before every update and older data is migrated without loss.</li>
  <li><b>Remove:</b> Windows “Apps & features”, macOS move the app to the Trash, Linux <code>sudo apt remove vertexforge-studio</code> or <code>./install.sh --uninstall</code>. Your projects are kept.</li></ul>`],
 ['settings','sliders','Language & settings',`
  <ul><li><b>Language:</b> Deutsch, English, Français, Español, Italiano, Português – in the status bar or in settings.</li>
  <li><b>Window:</b> on Windows a custom title bar (drag, double-click maximizes), on macOS and Linux the usual window bar; <kbd>F11</kbd> fullscreen.</li>
  <li><b>Data:</b> load sample projects, export a backup, reset projects or everything.</li></ul>`],
 ['keys','keyboard','All keyboard shortcuts','{KEYS}'],
 ['faq','compass','Questions & fixes',`
  <ul><li><b>The app does not start (Windows):</b> it needs the Microsoft Edge WebView2 Runtime (usually present on Windows 10/11). The error message names the exact reason and where the log file is.</li>
  <li><b>The app does not start (Linux):</b> WebKitGTK is missing – <code>sudo apt install libwebkit2gtk-4.1-0</code> (Fedora: <code>webkit2gtk4.1</code>).</li>
  <li><b>SmartScreen / Gatekeeper warns:</b> the app is not paid-signed – Windows: “More info → Run anyway”, macOS: System Settings → Privacy & Security → “Open Anyway”.</li>
  <li><b>Where is my data?</b> Windows: %LOCALAPPDATA%\\VertexForge Studio · macOS: ~/Library/Application Support/VertexForge Studio · Linux: ~/.local/share/vertexforge-studio · Browser: in the browser’s storage.</li>
  <li><b>Linked videos show no preview:</b> previews of files on your PC exist only in the desktop app; in the browser you can still open/copy.</li></ul>`]
],
fr: [
 ['start','compass','Premiers pas',`
  <p>VertexForge Studio est votre plan de production visuel pour les projets 3D – du premier moodboard au rendu final : bibliothèque de projets avec affiches, pipeline avec échéances, tableau pour idées, références et médias, liste des plans et bureau d’écriture avec bible du monde.</p>
  <div class="flow"><span class="st">1 · Créer un projet</span>›<span class="st">2 · Modèle de pipeline</span>›<span class="st">3 · Références sur le tableau</span>›<span class="st">4 · Lier des fichiers</span>›<span class="st">5 · Tenir les échéances</span></div>
  <ol><li><kbd>Ctrl</kbd>+<kbd>N</kbd> – nom, date de début et un modèle de pipeline, p. ex. « Personnage ».</li>
  <li>Dans le <b>designer de couverture</b> : titre, police, effet 3D et image.</li>
  <li>Dans le <b>pipeline</b> : ajuster les dates et estimer l’effort.</li>
  <li>Sur le <b>tableau</b> : ajouter images et vidéos ou lier des fichiers, puis les ancrer aux cartes d’asset.</li>
  <li>Enregistrer vos fichiers <b>.blend, .ztl, .spp ou .psd</b> sur les cartes d’asset.</li></ol>
  <div class="tip">Relancez la <b>visite guidée</b> via Aide ▸ Visite guidée. <kbd>F3</kbd> trouve toute commande, <kbd>?</kbd> affiche tous les raccourcis.</div>
  <div class="tip"><b>Pas d’art par IA :</b> VertexForge planifie et organise – il ne génère ni images, ni modèles, ni textes et ne remplace jamais les artistes. Votre art reste le vôtre.</div>`],
 ['projects','grid','Projets & bibliothèque',`
  <ul><li><b>Ouvrir :</b> cliquez sur une couverture. Le projet actif a un cadre doré et apparaît dans le sélecteur en haut.</li>
  <li><b>Actions rapides</b> au survol, <b>clic droit</b> pour toutes : styliser, image, dupliquer, exporter, supprimer.</li>
  <li>Les curseurs <b>« Couverture »</b> et <b>« Titre »</b> règlent la taille ; recherche et tri aident avec beaucoup de projets.</li></ul>`],
 ['designer','sliders','Designer de couverture & titres 3D',`
  <ul><li><b>Déplacer librement :</b> faites glisser titre ou bandeau dans l’aperçu – aimanté sur l’axe central (<kbd>Alt</kbd> = sans aimant).</li>
  <li><b>Retour à la ligne :</b> <kbd>Entrée</kbd>. Les <b>styles prédéfinis</b> règlent police, surface et effet 3D en un clic.</li>
  <li><b>Plus de 50 polices</b> (fantasy, 3D, cinéma, sci-fi, horreur, moderne, manuscrite), surfaces or, chrome ou néon, effets 3D comme extrusion, relief, lueur.</li>
  <li>Sous « Image & thème » : votre propre rendu, cadrage, vignette et thème de genre.</li></ul>`],
 ['pipeline','calendar','Pipeline, échéances & kanban',`
  <ul><li><b>Indicateurs :</b> avancement, prochaine échéance, retards, critiques, échéance du projet et effort restant par jour.</li>
  <li><b>Chronologie :</b> chaque phase en barre avec avancement et ligne « aujourd’hui ».</li>
  <li><b>Tâches :</b> statut (à faire → en cours → revue → terminé), priorité (Low à Critical), effort et échéance avec compte à rebours.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>) : glisser les tâches entre les colonnes.</li>
  <li><b>Insérer un modèle</b> ajoute des phases toutes prêtes.</li></ul>`],
 ['board','network','Tableau : idées, cartes, liens',`
  <ul><li><b>Éléments :</b> nœuds, cartes d’asset (étape de concept à final, fichiers liés), notes, titres stylisés, images, vidéos et fichiers liés.</li>
  <li><b>Ajouter :</b> barre d’outils à gauche, clic droit sur le fond ou <kbd>Maj</kbd>+<kbd>A</kbd> à la position de la souris.</li>
  <li><b>Relier :</b> tirez depuis le point ● à droite vers un autre élément – autant de liens que voulu. La poignée en bout de fil le déplace ou le supprime, <kbd>Ctrl</kbd>+clic droit glissé coupe les fils.</li>
  <li><b>Ancrage :</b> approchez images, vidéos, fichiers et titres d’une carte d’asset – ils s’alignent et suivent la carte. <b>Éloignez-les</b> (ou secouez, <kbd>Alt</kbd>+<kbd>P</kbd>) pour les détacher. <kbd>Ctrl</kbd>+<kbd>P</kbd> ancre la sélection à la carte active.</li>
  <li><b>Navigation (style Blender) :</b> molette = zoom, clic milieu/droit ou Espace = déplacer, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> déplacer/échelle/supprimer, <kbd>Début</kbd> cadre tout, clic droit annule.</li>
  <li><kbd>Ctrl</kbd> + molette ou <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> agrandit <b>toute l’interface</b>.</li></ul>`],
 ['media','image','Images, vidéos & fichiers liés',`
  <ul><li><b>Images :</b> glisser-déposer, <kbd>Ctrl</kbd>+<kbd>V</kbd> ou outil – intégrées de façon compacte.</li>
  <li><b>Vidéos</b> (MP4, WebM, MOV …) jusqu’à 80 Mo sont intégrées ; elles jouent en silence au survol, un <b>double-clic</b> ouvre la grande vue avec son.</li>
  <li><b>Lier un fichier :</b> pointe vers un fichier de votre PC sans le copier – idéal pour grosses vidéos, rendus ou .blend. L’app de bureau affiche images et vidéos en aperçu ; ouvrir et « Afficher dans le dossier » en un clic. Un chemin collé (<kbd>Ctrl</kbd>+<kbd>V</kbd>) est aussi lié.</li>
  <li>Un fichier lié introuvable s’affiche en rouge.</li></ul>`],
 ['designs','palette','Styles pour chaque espace',`
  <ul><li><b>Tableau :</b> la palette en haut à droite donne à chaque tableau son style – <b>Studio</b>, <b>Tableau en liège</b> (post-it punaisés, fils rouges), <b>Carnet</b>, <b>Plan</b>, <b>Tableau noir</b> ou <b>Verre</b>. Fond et style des nœuds se combinent aussi séparément.</li>
  <li><b>Histoire :</b> papier & police – parchemin, épuré, manuscrit, machine à écrire ou nuit.</li>
  <li><b>Plein écran de la zone de travail :</b> tableau et histoire via l’icône flèches ou <kbd>F11</kbd> – <kbd>Échap</kbd> pour sortir.</li></ul>`],
 ['software','folder','Logiciels & chemins',`
  <p>Les cartes d’asset et la bible du monde enregistrent les chemins de vos fichiers. Le logiciel est reconnu par l’extension : .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject et bien d’autres.</p>
  <table><tr><th></th><th>App de bureau</th><th>Navigateur</th></tr>
  <tr><td>Clic sur le badge</td><td>ouvre le fichier dans son logiciel</td><td>copie le chemin</td></tr>
  <tr><td>Parcourir</td><td>boîte de dialogue du système</td><td>coller le chemin</td></tr>
  <tr><td>Icônes</td><td>icônes des logiciels installés</td><td>codes couleur / vos icônes</td></tr></table>`],
 ['shots','film','Liste des plans',`
  <ul><li>Chaque plan : ID, image de storyboard, séquence, action, images, objectif et note VFX ; durée calculée selon la cadence.</li>
  <li>Statut des départements LAY · ANI · CFX · LGT · RND par clic : TODO → WIP → DONE.</li>
  <li><b>Réordonner :</b> glissez la poignée à droite (clic droit/Échap annule) ou <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> pendant la saisie.</li></ul>`],
 ['story','book','Histoire & lore',`
  <ul><li>Scènes et bible du monde à gauche, la page au centre, l’inspecteur d’asset à droite.</li>
  <li>Les boutons de format insèrent en-tête de scène, personnage, caméra et coupe ; les noms de la bible sont reconnus.</li>
  <li><b>Mode focus</b> (<kbd>Ctrl</kbd>+<kbd>Espace</kbd>) masque les panneaux, le <b>plein écran</b> (<kbd>F11</kbd>) tout le reste.</li></ul>`],
 ['save','download','Enregistrement, versions & sauvegarde',`
  <ul><li><b>Automatique :</b> chaque modification est sauvegardée localement.</li>
  <li><b>Fichier projet (.vforge) :</b> disquette en haut à droite ou <kbd>Ctrl</kbd>+<kbd>S</kbd> ; <kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>S</kbd> sous un autre nom ; <b>incrémental</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>S</kbd>) crée <i>_v02</i>, <i>_v03</i> …</li>
  <li><b>Versions</b> (icône horloge, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>) : toutes les 10 minutes, à chaque enregistrement, avant ouverture, restauration et mise à jour. Version nommée : <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>.</li></ul>
  <div class="tip">Dans le navigateur, effacer les données du navigateur supprime vos données – gardez des fichiers .vforge.</div>`],
 ['team','users','Travailler en équipe',`
  <p>Plusieurs personnes – ou vous sur plusieurs ordinateurs – travaillent sur le même projet, <b>sans serveur ni compte</b>, via un dossier déjà partagé (OneDrive, Dropbox, Google Drive, Nextcloud, lecteur réseau).</p>
  <ol><li><b>Fichier ▸ Partager dans un dossier d’équipe…</b></li><li>Les autres : <b>Fichier ▸ Ouvrir un projet d’équipe…</b> et choisir le dossier « .vforge-team ».</li><li><b>Équipe</b> à côté du nom du projet montre l’état et qui travaille.</li></ol>
  <p>Les modifications d’éléments différents sont fusionnées automatiquement. Si le même élément change en même temps, votre version est gardée et l’autre est conservée dans « conflicts ».</p>`],
 ['install','download','Installation & mises à jour',`
  <ul><li><b>Installer :</b> lancez « VertexForge Studio Setup.exe », choisissez langue et dossier – raccourcis bureau et menu Démarrer inclus.</li>
  <li><b>Mises à jour :</b> lancez simplement le nouveau setup. Vos projets sont stockés à part dans votre profil et ne sont <b>jamais écrasés</b> ; une version de sécurité est créée avant chaque mise à jour.</li>
  <li><b>Désinstaller :</b> via « Applications » de Windows. Vos projets sont conservés, sauf si vous choisissez « Supprimer les données locales ».</li></ul>`],
 ['settings','sliders','Langue & réglages',`
  <ul><li><b>Langue :</b> Deutsch, English, Français, Español, Italiano, Português – dans la barre d’état ou les réglages.</li>
  <li><b>Fenêtre :</b> barre de titre intégrée (glisser, double-clic agrandit) ; <kbd>F11</kbd> plein écran.</li>
  <li><b>Données :</b> projets d’exemple, sauvegarde, réinitialiser les projets ou tout.</li></ul>`],
 ['keys','keyboard','Tous les raccourcis','{KEYS}'],
 ['faq','compass','Questions & solutions',`
  <ul><li><b>L’app ne démarre pas :</b> elle requiert Microsoft Edge WebView2 Runtime (présent sur Windows 10/11 en général).</li>
  <li><b>SmartScreen avertit :</b> l’app n’est pas signée – « Informations complémentaires → Exécuter quand même ».</li>
  <li><b>Où sont mes données ?</b> Bureau : %LOCALAPPDATA%\\VertexForge Studio. Navigateur : stockage du navigateur.</li></ul>`]
],
es: [
 ['start','compass','Primeros pasos',`
  <p>VertexForge Studio es tu plan de producción visual para proyectos 3D – del primer moodboard al render final: biblioteca de proyectos con portadas, pipeline con plazos, tablero para ideas, referencias y medios, lista de planos y escritorio de escritura con biblia del mundo.</p>
  <div class="flow"><span class="st">1 · Crear proyecto</span>›<span class="st">2 · Plantilla de pipeline</span>›<span class="st">3 · Referencias al tablero</span>›<span class="st">4 · Vincular archivos</span>›<span class="st">5 · Cumplir plazos</span></div>
  <ol><li><kbd>Ctrl</kbd>+<kbd>N</kbd> – nombre, fecha de inicio y una plantilla, p. ej. «Personaje».</li>
  <li>En el <b>diseñador de portadas</b>: título, fuente, efecto 3D e imagen.</li>
  <li>En el <b>pipeline</b>: ajustar fechas y estimar el esfuerzo.</li>
  <li>En el <b>tablero</b>: añadir imágenes y vídeos o vincular archivos y acoplarlos a tarjetas de asset.</li>
  <li>Guardar tus archivos <b>.blend, .ztl, .spp o .psd</b> en las tarjetas.</li></ol>
  <div class="tip">Repite el <b>tour guiado</b> en Ayuda ▸ Tour guiado. <kbd>F3</kbd> encuentra cualquier comando, <kbd>?</kbd> muestra los atajos.</div>
  <div class="tip"><b>Sin arte con IA:</b> VertexForge planifica y organiza: no genera imágenes, modelos ni textos y nunca sustituye a artistas. Tu arte sigue siendo tuyo.</div>`],
 ['projects','grid','Proyectos y biblioteca',`
  <ul><li><b>Abrir:</b> haz clic en una portada. El proyecto activo tiene marco dorado y aparece en el selector superior.</li>
  <li><b>Acciones rápidas</b> al pasar el ratón, <b>clic derecho</b> para todas: diseñar, imagen, duplicar, exportar, eliminar.</li>
  <li>Los controles <b>«Portada»</b> y <b>«Título»</b> cambian el tamaño; búsqueda y orden ayudan con muchos proyectos.</li></ul>`],
 ['designer','sliders','Diseñador de portadas y títulos 3D',`
  <ul><li><b>Mover libremente:</b> arrastra título o banner en la vista previa; se ajusta al eje central (<kbd>Alt</kbd> = sin ajuste).</li>
  <li><b>Salto de línea:</b> <kbd>Intro</kbd>. Los <b>estilos predefinidos</b> fijan fuente, superficie y efecto 3D con un clic.</li>
  <li><b>Más de 50 fuentes</b> (fantasía, 3D, cine, ciencia ficción, terror, moderna, manuscrita), superficies oro, cromo o neón, efectos 3D como extrusión, relieve, brillo.</li>
  <li>En «Imagen y tema»: tu propio render, encuadre, viñeta y tema de género.</li></ul>`],
 ['pipeline','calendar','Pipeline, plazos y kanban',`
  <ul><li><b>Indicadores:</b> progreso, próximo plazo, atrasos, críticos, plazo del proyecto y esfuerzo restante por día.</li>
  <li><b>Línea de tiempo:</b> cada fase como barra con progreso y línea de «hoy».</li>
  <li><b>Tareas:</b> estado (pendiente → en curso → revisión → hecho), prioridad (Low a Critical), esfuerzo y plazo con cuenta atrás.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>): arrastra tareas entre columnas.</li>
  <li><b>Insertar plantilla</b> añade fases listas.</li></ul>`],
 ['board','network','Tablero: ideas, tarjetas, conexiones',`
  <ul><li><b>Elementos:</b> nodos, tarjetas de asset (etapa de concepto a final, archivos vinculados), notas, títulos con estilo, imágenes, vídeos y archivos vinculados.</li>
  <li><b>Añadir:</b> barra de herramientas a la izquierda, clic derecho en el fondo o <kbd>Mayús</kbd>+<kbd>A</kbd> en la posición del ratón.</li>
  <li><b>Conectar:</b> arrastra desde el punto ● de la derecha a otro elemento: tantas conexiones como quieras. El asa del extremo del cable lo reconecta o elimina, <kbd>Ctrl</kbd>+arrastre derecho corta cables.</li>
  <li><b>Acoplar:</b> acerca imágenes, vídeos, archivos y títulos a una tarjeta de asset: se alinean y se mueven con ella. <b>Apártalos</b> de nuevo (o agita, <kbd>Alt</kbd>+<kbd>P</kbd>) para soltarlos. <kbd>Ctrl</kbd>+<kbd>P</kbd> acopla la selección a la tarjeta activa.</li>
  <li><b>Navegación (estilo Blender):</b> rueda = zoom, arrastre medio/derecho o Espacio = mover, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> mover/escalar/borrar, <kbd>Inicio</kbd> encuadra todo, clic derecho cancela.</li>
  <li><kbd>Ctrl</kbd> + rueda o <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> escala <b>toda la interfaz</b>.</li></ul>`],
 ['media','image','Imágenes, vídeos y archivos vinculados',`
  <ul><li><b>Imágenes:</b> arrastrar y soltar, <kbd>Ctrl</kbd>+<kbd>V</kbd> o herramienta; se incrustan de forma compacta.</li>
  <li><b>Vídeos</b> (MP4, WebM, MOV …) de hasta 80 MB se incrustan; se reproducen en silencio al pasar el ratón y el <b>doble clic</b> abre la vista grande con sonido.</li>
  <li><b>Vincular archivo:</b> apunta a un archivo de tu PC sin copiarlo: ideal para vídeos grandes, renders o .blend. La app de escritorio muestra imágenes y vídeos como vista previa; abrir y «Mostrar en carpeta» con un clic. Una ruta pegada (<kbd>Ctrl</kbd>+<kbd>V</kbd>) también se vincula.</li>
  <li>Si falta un archivo vinculado, su ruta se marca en rojo.</li></ul>`],
 ['designs','palette','Diseños para cada área',`
  <ul><li><b>Tablero:</b> la paleta arriba a la derecha da a cada tablero su aspecto: <b>Estudio</b>, <b>Tablón de corcho</b> (notas con chinchetas, hilos rojos), <b>Cuaderno</b>, <b>Plano</b>, <b>Pizarra</b> o <b>Cristal</b>. Fondo y estilo de nodos también por separado.</li>
  <li><b>Historia:</b> papel y tipografía: pergamino, limpio, manuscrito, máquina de escribir o noche.</li>
  <li><b>Pantalla completa del área:</b> tablero e historia con el icono de flechas o <kbd>F11</kbd>; <kbd>Esc</kbd> para salir.</li></ul>`],
 ['software','folder','Software y rutas',`
  <p>Las tarjetas de asset y la biblia del mundo guardan rutas a tus archivos. El programa se reconoce por la extensión: .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject y muchas más.</p>
  <table><tr><th></th><th>App de escritorio</th><th>Navegador</th></tr>
  <tr><td>Clic en la insignia</td><td>abre el archivo en su programa</td><td>copia la ruta</td></tr>
  <tr><td>Examinar</td><td>diálogo del sistema</td><td>pegar la ruta</td></tr>
  <tr><td>Iconos</td><td>iconos de los programas instalados</td><td>códigos de color / tus iconos</td></tr></table>`],
 ['shots','film','Lista de planos',`
  <ul><li>Cada plano: ID, imagen de storyboard, secuencia, acción, frames, lente y nota VFX; la duración se calcula según la cadencia.</li>
  <li>Estado de departamentos LAY · ANI · CFX · LGT · RND con clic: TODO → WIP → DONE.</li>
  <li><b>Reordenar:</b> arrastra el asa derecha (clic derecho/Esc cancela) o <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> al escribir.</li></ul>`],
 ['story','book','Historia y lore',`
  <ul><li>Escenas y biblia del mundo a la izquierda, el papel en el centro, el inspector a la derecha.</li>
  <li>Los botones de formato insertan encabezado, personaje, cámara y corte; los nombres de la biblia se reconocen.</li>
  <li><b>Modo foco</b> (<kbd>Ctrl</kbd>+<kbd>Espacio</kbd>) oculta los paneles, la <b>pantalla completa</b> (<kbd>F11</kbd>) todo lo demás.</li></ul>`],
 ['save','download','Guardado, versiones y copias',`
  <ul><li><b>Automático:</b> cada cambio se guarda localmente al instante.</li>
  <li><b>Archivo de proyecto (.vforge):</b> disquete arriba a la derecha o <kbd>Ctrl</kbd>+<kbd>S</kbd>; <kbd>Ctrl</kbd>+<kbd>Mayús</kbd>+<kbd>S</kbd> con otro nombre; <b>incremental</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Mayús</kbd>+<kbd>S</kbd>) crea <i>_v02</i>, <i>_v03</i> …</li>
  <li><b>Versiones</b> (icono de reloj, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>): cada 10 minutos, al guardar, antes de abrir, restaurar y actualizar. Versión con nombre: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>.</li></ul>
  <div class="tip">En el navegador, borrar sus datos elimina tus proyectos: guarda archivos .vforge.</div>`],
 ['team','users','Trabajar en equipo',`
  <p>Varias personas – o tú en varios ordenadores – trabajan en el mismo proyecto <b>sin servidor ni cuenta</b>, mediante una carpeta ya compartida (OneDrive, Dropbox, Google Drive, Nextcloud, unidad de red).</p>
  <ol><li><b>Archivo ▸ Compartir en carpeta de equipo…</b></li><li>Los demás: <b>Archivo ▸ Abrir proyecto de equipo…</b> y elegir la carpeta «.vforge-team».</li><li><b>Equipo</b> junto al nombre del proyecto muestra el estado y quién trabaja.</li></ol>
  <p>Los cambios en elementos distintos se combinan solos. Si el mismo elemento cambia a la vez, se mantiene tu versión y la otra se guarda en «conflicts».</p>`],
 ['install','download','Instalación y actualizaciones',`
  <ul><li><b>Instalar:</b> ejecuta «VertexForge Studio Setup.exe», elige idioma y carpeta; se crean accesos directos en el escritorio y el menú Inicio.</li>
  <li><b>Actualizar:</b> ejecuta el nuevo instalador. Tus proyectos se guardan aparte en tu perfil y <b>nunca se sobrescriben</b>; antes de cada actualización se crea una versión de seguridad.</li>
  <li><b>Desinstalar:</b> desde «Aplicaciones» de Windows. Tus proyectos se conservan salvo que elijas «Eliminar datos locales».</li></ul>`],
 ['settings','sliders','Idioma y ajustes',`
  <ul><li><b>Idioma:</b> Deutsch, English, Français, Español, Italiano, Português – en la barra de estado o en ajustes.</li>
  <li><b>Ventana:</b> barra de título integrada (arrastrar, doble clic maximiza); <kbd>F11</kbd> pantalla completa.</li>
  <li><b>Datos:</b> proyectos de ejemplo, copia de seguridad, restablecer proyectos o todo.</li></ul>`],
 ['keys','keyboard','Todos los atajos','{KEYS}'],
 ['faq','compass','Preguntas y soluciones',`
  <ul><li><b>La app no arranca:</b> necesita Microsoft Edge WebView2 Runtime (normalmente presente en Windows 10/11).</li>
  <li><b>SmartScreen avisa:</b> la app no está firmada: «Más información → Ejecutar de todos modos».</li>
  <li><b>¿Dónde están mis datos?</b> Escritorio: %LOCALAPPDATA%\\VertexForge Studio. Navegador: almacenamiento del navegador.</li></ul>`]
],
it: [
 ['start','compass','Primi passi',`
  <p>VertexForge Studio è il tuo piano di produzione visivo per progetti 3D – dal primo moodboard al render finale: libreria di progetti con copertine, pipeline con scadenze, lavagna per idee, reference e media, lista inquadrature e scrivania con bibbia del mondo.</p>
  <div class="flow"><span class="st">1 · Crea progetto</span>›<span class="st">2 · Modello pipeline</span>›<span class="st">3 · Reference sulla lavagna</span>›<span class="st">4 · Collega file</span>›<span class="st">5 · Rispetta le scadenze</span></div>
  <ol><li><kbd>Ctrl</kbd>+<kbd>N</kbd> – nome, data di inizio e un modello, ad es. «Personaggio».</li>
  <li>Nel <b>designer della copertina</b>: titolo, font, effetto 3D e immagine.</li>
  <li>Nella <b>pipeline</b>: regola le date e stima l’impegno.</li>
  <li>Sulla <b>lavagna</b>: aggiungi immagini e video o collega file e agganciali alle schede asset.</li>
  <li>Salva i tuoi file <b>.blend, .ztl, .spp o .psd</b> sulle schede.</li></ol>
  <div class="tip">Ripeti il <b>tour guidato</b> da Aiuto ▸ Tour guidato. <kbd>F3</kbd> trova ogni comando, <kbd>?</kbd> mostra tutte le scorciatoie.</div>
  <div class="tip"><b>Niente arte con IA:</b> VertexForge pianifica e organizza – non genera immagini, modelli o testi e non sostituisce mai gli artisti. La tua arte resta tua.</div>`],
 ['projects','grid','Progetti e libreria',`
  <ul><li><b>Aprire:</b> clic su una copertina. Il progetto attivo ha una cornice dorata ed è nel selettore in alto.</li>
  <li><b>Azioni rapide</b> al passaggio del mouse, <b>clic destro</b> per tutte: design, immagine, duplica, esporta, elimina.</li>
  <li>I cursori <b>«Copertina»</b> e <b>«Titolo»</b> regolano le dimensioni; ricerca e ordinamento aiutano con molti progetti.</li></ul>`],
 ['designer','sliders','Designer copertina e titoli 3D',`
  <ul><li><b>Sposta liberamente:</b> trascina titolo o banner nell’anteprima – si aggancia all’asse centrale (<kbd>Alt</kbd> = senza aggancio).</li>
  <li><b>A capo:</b> <kbd>Invio</kbd>. Gli <b>stili predefiniti</b> impostano font, superficie ed effetto 3D con un clic.</li>
  <li><b>Oltre 50 font</b> (fantasy, 3D, cinema, sci-fi, horror, moderni, scritti a mano), superfici oro, cromo o neon, effetti 3D come estrusione, rilievo, bagliore.</li>
  <li>In «Immagine e tema»: il tuo render, inquadratura, vignettatura e tema di genere.</li></ul>`],
 ['pipeline','calendar','Pipeline, scadenze e kanban',`
  <ul><li><b>Indicatori:</b> avanzamento, prossima scadenza, ritardi, critici, scadenza del progetto e impegno residuo al giorno.</li>
  <li><b>Linea temporale:</b> ogni fase come barra con avanzamento e linea «oggi».</li>
  <li><b>Attività:</b> stato (da fare → in corso → revisione → fatto), priorità (Low–Critical), impegno e scadenza con conto alla rovescia.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>): trascina le attività tra le colonne.</li>
  <li><b>Inserisci modello</b> aggiunge fasi pronte.</li></ul>`],
 ['board','network','Lavagna: idee, schede, collegamenti',`
  <ul><li><b>Elementi:</b> nodi, schede asset (fase da concept a final, file collegati), note, titoli stilizzati, immagini, video e file collegati.</li>
  <li><b>Aggiungere:</b> barra strumenti a sinistra, clic destro sullo sfondo o <kbd>Maiusc</kbd>+<kbd>A</kbd> nella posizione del mouse.</li>
  <li><b>Collegare:</b> trascina dal punto ● a destra su un altro elemento – quanti collegamenti vuoi. La maniglia a fine cavo lo ricollega o lo rimuove, <kbd>Ctrl</kbd>+trascinamento destro taglia i cavi.</li>
  <li><b>Aggancio:</b> avvicina immagini, video, file e titoli a una scheda asset – si allineano e la seguono. <b>Allontanali</b> (o scuoti, <kbd>Alt</kbd>+<kbd>P</kbd>) per sganciarli. <kbd>Ctrl</kbd>+<kbd>P</kbd> aggancia la selezione alla scheda attiva.</li>
  <li><b>Navigazione (stile Blender):</b> rotella = zoom, trascinamento centrale/destro o Spazio = sposta, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> sposta/scala/elimina, <kbd>Home</kbd> inquadra tutto, clic destro annulla.</li>
  <li><kbd>Ctrl</kbd> + rotella o <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> scala <b>tutta l’interfaccia</b>.</li></ul>`],
 ['media','image','Immagini, video e file collegati',`
  <ul><li><b>Immagini:</b> trascina e rilascia, <kbd>Ctrl</kbd>+<kbd>V</kbd> o strumento – incorporate in modo compatto.</li>
  <li><b>Video</b> (MP4, WebM, MOV …) fino a 80 MB vengono incorporati; partono in silenzio al passaggio del mouse, il <b>doppio clic</b> apre la vista grande con audio.</li>
  <li><b>Collega un file:</b> rimanda a un file del PC senza copiarlo – ideale per video grandi, render o .blend. L’app desktop mostra immagini e video in anteprima; apri e «Mostra nella cartella» con un clic. Anche un percorso incollato (<kbd>Ctrl</kbd>+<kbd>V</kbd>) viene collegato.</li>
  <li>Se un file collegato manca, il percorso diventa rosso.</li></ul>`],
 ['designs','palette','Stili per ogni area',`
  <ul><li><b>Lavagna:</b> la tavolozza in alto a destra dà a ogni lavagna il suo stile – <b>Studio</b>, <b>Bacheca</b> (sughero, foglietti con puntine, fili rossi), <b>Taccuino</b>, <b>Cianografia</b>, <b>Lavagna nera</b> o <b>Vetro</b>. Sfondo e stile dei nodi anche separati.</li>
  <li><b>Storia:</b> carta e carattere – pergamena, pulito, manoscritto, macchina da scrivere o notte.</li>
  <li><b>Schermo intero dell’area:</b> lavagna e storia con l’icona a frecce o <kbd>F11</kbd> – <kbd>Esc</kbd> per uscire.</li></ul>`],
 ['software','folder','Software e percorsi',`
  <p>Schede asset e bibbia del mondo salvano i percorsi dei tuoi file. Il programma è riconosciuto dall’estensione: .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject e molte altre.</p>
  <table><tr><th></th><th>App desktop</th><th>Browser</th></tr>
  <tr><td>Clic sul badge</td><td>apre il file nel suo programma</td><td>copia il percorso</td></tr>
  <tr><td>Sfoglia</td><td>finestra file di Windows</td><td>incolla il percorso</td></tr>
  <tr><td>Icone</td><td>icone dei programmi installati</td><td>codici colore / icone tue</td></tr></table>`],
 ['shots','film','Lista inquadrature',`
  <ul><li>Ogni inquadratura: ID, immagine storyboard, sequenza, azione, frame, lente e nota VFX; la durata si calcola dalla frequenza.</li>
  <li>Stato dei reparti LAY · ANI · CFX · LGT · RND con un clic: TODO → WIP → DONE.</li>
  <li><b>Riordinare:</b> trascina la maniglia a destra (clic destro/Esc annulla) o <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> mentre scrivi.</li></ul>`],
 ['story','book','Storia e lore',`
  <ul><li>Scene e bibbia del mondo a sinistra, il foglio al centro, l’ispettore a destra.</li>
  <li>I pulsanti di formato inseriscono intestazione, personaggio, camera e stacco; i nomi della bibbia vengono riconosciuti.</li>
  <li><b>Modalità focus</b> (<kbd>Ctrl</kbd>+<kbd>Spazio</kbd>) nasconde i pannelli, lo <b>schermo intero</b> (<kbd>F11</kbd>) tutto il resto.</li></ul>`],
 ['save','download','Salvataggio, versioni e backup',`
  <ul><li><b>Automatico:</b> ogni modifica è salvata subito in locale.</li>
  <li><b>File progetto (.vforge):</b> dischetto in alto a destra o <kbd>Ctrl</kbd>+<kbd>S</kbd>; <kbd>Ctrl</kbd>+<kbd>Maiusc</kbd>+<kbd>S</kbd> con nuovo nome; <b>incrementale</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Maiusc</kbd>+<kbd>S</kbd>) crea <i>_v02</i>, <i>_v03</i> …</li>
  <li><b>Versioni</b> (icona orologio, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>): ogni 10 minuti, a ogni salvataggio, prima di aprire, ripristinare e aggiornare. Versione con nome: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>.</li></ul>
  <div class="tip">Nel browser, cancellare i dati del browser elimina i progetti – conserva file .vforge.</div>`],
 ['team','users','Lavorare in team',`
  <p>Più persone – o tu su più computer – lavorano sullo stesso progetto <b>senza server né account</b>, tramite una cartella già condivisa (OneDrive, Dropbox, Google Drive, Nextcloud, unità di rete).</p>
  <ol><li><b>File ▸ Condividi in una cartella del team…</b></li><li>Gli altri: <b>File ▸ Apri progetto del team…</b> e scegliere la cartella «.vforge-team».</li><li><b>Team</b> accanto al nome del progetto mostra lo stato e chi sta lavorando.</li></ol>
  <p>Le modifiche a elementi diversi vengono unite automaticamente. Se lo stesso elemento cambia insieme, vale la tua versione e l’altra resta in «conflicts».</p>`],
 ['install','download','Installazione e aggiornamenti',`
  <ul><li><b>Installare:</b> avvia «VertexForge Studio Setup.exe», scegli lingua e cartella – vengono create le scorciatoie su desktop e menu Start.</li>
  <li><b>Aggiornare:</b> avvia il nuovo setup. I progetti sono salvati a parte nel tuo profilo e <b>non vengono mai sovrascritti</b>; prima di ogni aggiornamento si crea una versione di sicurezza.</li>
  <li><b>Disinstallare:</b> da «App» di Windows. I progetti restano, a meno che tu scelga «Elimina dati locali».</li></ul>`],
 ['settings','sliders','Lingua e impostazioni',`
  <ul><li><b>Lingua:</b> Deutsch, English, Français, Español, Italiano, Português – nella barra di stato o nelle impostazioni.</li>
  <li><b>Finestra:</b> barra del titolo integrata (trascina, doppio clic ingrandisce); <kbd>F11</kbd> schermo intero.</li>
  <li><b>Dati:</b> progetti di esempio, backup, ripristino dei progetti o di tutto.</li></ul>`],
 ['keys','keyboard','Tutte le scorciatoie','{KEYS}'],
 ['faq','compass','Domande e soluzioni',`
  <ul><li><b>L’app non si avvia:</b> serve Microsoft Edge WebView2 Runtime (di solito presente in Windows 10/11).</li>
  <li><b>SmartScreen avvisa:</b> l’app non è firmata – «Ulteriori informazioni → Esegui comunque».</li>
  <li><b>Dove sono i miei dati?</b> Desktop: %LOCALAPPDATA%\\VertexForge Studio. Browser: memoria del browser.</li></ul>`]
],
pt: [
 ['start','compass','Primeiros passos',`
  <p>VertexForge Studio é o seu plano de produção visual para projetos 3D – do primeiro moodboard ao render final: biblioteca de projetos com capas, pipeline com prazos, quadro para ideias, referências e mídias, lista de planos e mesa de escrita com bíblia do mundo.</p>
  <div class="flow"><span class="st">1 · Criar projeto</span>›<span class="st">2 · Modelo de pipeline</span>›<span class="st">3 · Referências no quadro</span>›<span class="st">4 · Vincular arquivos</span>›<span class="st">5 · Cumprir prazos</span></div>
  <ol><li><kbd>Ctrl</kbd>+<kbd>N</kbd> – nome, data de início e um modelo, ex.: «Personagem».</li>
  <li>No <b>designer de capa</b>: título, fonte, efeito 3D e imagem.</li>
  <li>No <b>pipeline</b>: ajustar datas e estimar o esforço.</li>
  <li>No <b>quadro</b>: adicionar imagens e vídeos ou vincular arquivos e acoplá-los aos cartões de asset.</li>
  <li>Guardar seus arquivos <b>.blend, .ztl, .spp ou .psd</b> nos cartões.</li></ol>
  <div class="tip">Repita o <b>tour guiado</b> em Ajuda ▸ Tour guiado. <kbd>F3</kbd> encontra qualquer comando, <kbd>?</kbd> mostra os atalhos.</div>
  <div class="tip"><b>Sem arte de IA:</b> o VertexForge planeja e organiza – não gera imagens, modelos ou textos e nunca substitui artistas. Sua arte continua sua.</div>`],
 ['projects','grid','Projetos e biblioteca',`
  <ul><li><b>Abrir:</b> clique numa capa. O projeto ativo tem moldura dourada e aparece no seletor no topo.</li>
  <li><b>Ações rápidas</b> ao passar o mouse, <b>botão direito</b> para todas: design, imagem, duplicar, exportar, excluir.</li>
  <li>Os controles <b>«Capa»</b> e <b>«Título»</b> mudam o tamanho; busca e ordenação ajudam com muitos projetos.</li></ul>`],
 ['designer','sliders','Designer de capa e títulos 3D',`
  <ul><li><b>Mover livremente:</b> arraste título ou banner na prévia – encaixa no eixo central (<kbd>Alt</kbd> = sem encaixe).</li>
  <li><b>Quebra de linha:</b> <kbd>Enter</kbd>. Os <b>estilos prontos</b> definem fonte, superfície e efeito 3D com um clique.</li>
  <li><b>Mais de 50 fontes</b> (fantasia, 3D, cinema, ficção científica, terror, moderna, manuscrita), superfícies ouro, cromo ou neon, efeitos 3D como extrusão, relevo, brilho.</li>
  <li>Em «Imagem e tema»: seu render, enquadramento, vinheta e tema de gênero.</li></ul>`],
 ['pipeline','calendar','Pipeline, prazos e kanban',`
  <ul><li><b>Indicadores:</b> progresso, próximo prazo, atrasos, críticos, prazo do projeto e esforço restante por dia.</li>
  <li><b>Linha do tempo:</b> cada fase como barra com progresso e linha de «hoje».</li>
  <li><b>Tarefas:</b> status (a fazer → em andamento → revisão → feito), prioridade (Low a Critical), esforço e prazo com contagem regressiva.</li>
  <li><b>Kanban</b> (<kbd>V</kbd>): arraste tarefas entre colunas.</li>
  <li><b>Inserir modelo</b> adiciona fases prontas.</li></ul>`],
 ['board','network','Quadro: ideias, cartões, conexões',`
  <ul><li><b>Elementos:</b> nós, cartões de asset (etapa de conceito a final, arquivos vinculados), notas, títulos estilizados, imagens, vídeos e arquivos vinculados.</li>
  <li><b>Adicionar:</b> barra de ferramentas à esquerda, botão direito no fundo ou <kbd>Shift</kbd>+<kbd>A</kbd> na posição do mouse.</li>
  <li><b>Conectar:</b> arraste do ponto ● à direita até outro elemento – quantas conexões quiser. A alça na ponta do cabo reconecta ou remove, <kbd>Ctrl</kbd>+arrasto direito corta cabos.</li>
  <li><b>Acoplar:</b> aproxime imagens, vídeos, arquivos e títulos de um cartão de asset – eles se alinham e o acompanham. <b>Afaste-os</b> (ou sacuda, <kbd>Alt</kbd>+<kbd>P</kbd>) para soltar. <kbd>Ctrl</kbd>+<kbd>P</kbd> acopla a seleção ao cartão ativo.</li>
  <li><b>Navegação (estilo Blender):</b> roda = zoom, arrasto do meio/direito ou Espaço = mover, <kbd>G</kbd>/<kbd>S</kbd>/<kbd>X</kbd> mover/escalar/excluir, <kbd>Home</kbd> enquadra tudo, botão direito cancela.</li>
  <li><kbd>Ctrl</kbd> + roda ou <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>0</kbd> escala <b>toda a interface</b>.</li></ul>`],
 ['media','image','Imagens, vídeos e arquivos vinculados',`
  <ul><li><b>Imagens:</b> arrastar e soltar, <kbd>Ctrl</kbd>+<kbd>V</kbd> ou ferramenta – incorporadas de forma compacta.</li>
  <li><b>Vídeos</b> (MP4, WebM, MOV …) até 80 MB são incorporados; tocam sem som ao passar o mouse, o <b>clique duplo</b> abre a visualização grande com som.</li>
  <li><b>Vincular arquivo:</b> aponta para um arquivo do seu PC sem copiá-lo – ideal para vídeos grandes, renders ou .blend. O app desktop mostra imagens e vídeos em prévia; abrir e «Mostrar na pasta» com um clique. Um caminho colado (<kbd>Ctrl</kbd>+<kbd>V</kbd>) também é vinculado.</li>
  <li>Se um arquivo vinculado faltar, o caminho fica vermelho.</li></ul>`],
 ['designs','palette','Designs para cada área',`
  <ul><li><b>Quadro:</b> a paleta no canto superior direito dá a cada quadro seu visual – <b>Estúdio</b>, <b>Mural de cortiça</b> (post-its com alfinetes, fios vermelhos), <b>Caderno</b>, <b>Planta</b>, <b>Quadro-negro</b> ou <b>Vidro</b>. Fundo e estilo dos nós também separados.</li>
  <li><b>História:</b> papel e fonte – pergaminho, limpo, manuscrito, máquina de escrever ou noite.</li>
  <li><b>Tela cheia da área:</b> quadro e história pelo ícone de setas ou <kbd>F11</kbd> – <kbd>Esc</kbd> para sair.</li></ul>`],
 ['software','folder','Software e caminhos',`
  <p>Cartões de asset e a bíblia do mundo guardam caminhos para seus arquivos. O programa é reconhecido pela extensão: .blend, .ztl, .spp, .sbs, .zprj, .psd, .aep, .drp, .uproject e muitas outras.</p>
  <table><tr><th></th><th>App desktop</th><th>Navegador</th></tr>
  <tr><td>Clique no selo</td><td>abre o arquivo no programa</td><td>copia o caminho</td></tr>
  <tr><td>Procurar</td><td>diálogo do Windows</td><td>colar o caminho</td></tr>
  <tr><td>Ícones</td><td>ícones dos programas instalados</td><td>códigos de cor / seus ícones</td></tr></table>`],
 ['shots','film','Lista de planos',`
  <ul><li>Cada plano: ID, imagem de storyboard, sequência, ação, frames, lente e nota de VFX; a duração vem da taxa de quadros.</li>
  <li>Status dos departamentos LAY · ANI · CFX · LGT · RND com um clique: TODO → WIP → DONE.</li>
  <li><b>Reordenar:</b> arraste a alça à direita (botão direito/Esc cancela) ou <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> ao digitar.</li></ul>`],
 ['story','book','História e lore',`
  <ul><li>Cenas e bíblia do mundo à esquerda, o papel no centro, o inspetor à direita.</li>
  <li>Os botões de formato inserem cabeçalho de cena, personagem, câmera e corte; nomes da bíblia são reconhecidos.</li>
  <li><b>Modo foco</b> (<kbd>Ctrl</kbd>+<kbd>Espaço</kbd>) oculta os painéis, a <b>tela cheia</b> (<kbd>F11</kbd>) todo o resto.</li></ul>`],
 ['save','download','Salvamento, versões e backup',`
  <ul><li><b>Automático:</b> cada alteração é salva localmente na hora.</li>
  <li><b>Arquivo de projeto (.vforge):</b> disquete no canto superior direito ou <kbd>Ctrl</kbd>+<kbd>S</kbd>; <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> com outro nome; <b>incremental</b> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>) cria <i>_v02</i>, <i>_v03</i> …</li>
  <li><b>Versões</b> (ícone de relógio, <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd>): a cada 10 minutos, ao salvar, antes de abrir, restaurar e atualizar. Versão com nome: <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>.</li></ul>
  <div class="tip">No navegador, limpar os dados do navegador apaga seus projetos – guarde arquivos .vforge.</div>`],
 ['team','users','Trabalhar em equipe',`
  <p>Várias pessoas – ou você em vários computadores – trabalham no mesmo projeto <b>sem servidor nem conta</b>, por uma pasta já compartilhada (OneDrive, Dropbox, Google Drive, Nextcloud, rede).</p>
  <ol><li><b>Arquivo ▸ Compartilhar numa pasta de equipe…</b></li><li>Os outros: <b>Arquivo ▸ Abrir projeto de equipe…</b> e escolher a pasta “.vforge-team”.</li><li><b>Equipe</b> ao lado do nome do projeto mostra o estado e quem está trabalhando.</li></ol>
  <p>Alterações em elementos diferentes são unidas automaticamente. Se o mesmo elemento muda ao mesmo tempo, vale a sua versão e a outra fica em “conflicts”.</p>`],
 ['install','download','Instalação e atualizações',`
  <ul><li><b>Instalar:</b> execute «VertexForge Studio Setup.exe», escolha idioma e pasta – atalhos na área de trabalho e no menu Iniciar são criados.</li>
  <li><b>Atualizar:</b> basta executar o novo instalador. Seus projetos ficam separados no seu perfil e <b>nunca são sobrescritos</b>; antes de cada atualização é criada uma versão de segurança.</li>
  <li><b>Remover:</b> em «Aplicativos» do Windows. Seus projetos são mantidos, a menos que você escolha «Excluir dados locais».</li></ul>`],
 ['settings','sliders','Idioma e ajustes',`
  <ul><li><b>Idioma:</b> Deutsch, English, Français, Español, Italiano, Português – na barra de status ou nos ajustes.</li>
  <li><b>Janela:</b> barra de título integrada (arrastar, clique duplo maximiza); <kbd>F11</kbd> tela cheia.</li>
  <li><b>Dados:</b> projetos de exemplo, backup, redefinir projetos ou tudo.</li></ul>`],
 ['keys','keyboard','Todos os atalhos','{KEYS}'],
 ['faq','compass','Perguntas e soluções',`
  <ul><li><b>O app não inicia:</b> precisa do Microsoft Edge WebView2 Runtime (geralmente presente no Windows 10/11).</li>
  <li><b>O SmartScreen avisa:</b> o app não é assinado – «Mais informações → Executar assim mesmo».</li>
  <li><b>Onde estão meus dados?</b> Desktop: %LOCALAPPDATA%\\VertexForge Studio. Navegador: armazenamento do navegador.</li></ul>`]
]
};
