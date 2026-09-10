# Help Section & Usabiliy

We've made a lot of changes over the last 4-5 requirements files and I believe the help section has gone out of sync.

I'd like to 2 things. 

1 ensure that the help section reflects the latest changes to the system, and that it is clear and easy to understand incl.
- ability to drag and move pins
- ability to switch between locations using the dropdown picker
- ability to change the color of a path using the color picker

the help section should also include a link to the github repo for the project, and a link to the issues page for the project.

I'd also like to add some keyboard short cuts, and make sure that all of them are included at the very top of the help section.

<Shift> + ? :Open the help modal
esc: Close the help modal (if open)
a: Add a new path (toast message: "Path added")
z: Undo the last action (toast message: "Last action undone")
e: Enclose the current active path (toast message: "Path enclosed")
c: Clear all paths (toast message: "All paths cleared")

for 'a', 'z' and 'e' a small toast notification should appear on screen to 
for 'c' a confirmation modal should appear asking the user if they are sure they want to clear all paths. If yes, clear all paths and show a toast message "All paths cleared". If no, cancel the action.

Please make sure that the 

**Note**

Currently the button for closing a path says "Close Path" but it should say "Enclose Path" to be consistent with the keyboard shortcut and the toast message.
Please update the button text and any help text accordingly.

Also if it's possible to add an "eraser" emoji to the "Clear All Paths" button, that would be a nice touch.