# First Usage

When a user first opens the application, a popup will appear to get them started.

Ideally it'll be a little light box tutorial highlighting certain parts of the site.
Once they done the initial tutorial, they can click a button to dismiss it and it won't show again (local cookie/client storage flag).
If the debug=1 query param is set, the tutorial will always show.
Feel free to use a well known library for this, or roll your own.

The following is an example of what the tutorial might look like but I'll leave the design and implementation up to you so long as you cover an intro +5-6 core features in the order below.

1. A modal popup saying, this is a pitch liner application for whitehall Colmcille and what it lets you do at a high level.

[NEXT]

2. Click on the map to add pins to a path

[NEXT]

3. Click on the "new path" or press 'n' to start a new path

[NEXT]

4. The drop down picker quickly lets you jump between multiple locations...

[NEXT]

5. you can save/load or share your map with others

[NEXT]

6. Click the help button to find out more.