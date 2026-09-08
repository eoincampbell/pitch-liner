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
n: Create a new path (toast message: "New path created")
z: Undo the last action (toast message: "Last action undone")
c: close the current active path (toast message: "Path closed")
a: clear all paths 

for 'n', 'z' and 'c' a small toast notification should appear on screen to 
for 'a' a confirmation modal should appear asking the user if they are sure they want to clear all paths. If yes, clear all paths and show a toast message "All paths cleared". If no, cancel the action.

