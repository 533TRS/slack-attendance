/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

require('dotenv').config({ path: './a.env' });
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { WebClient } = require('@slack/web-api');
const buildAttendanceModal = require('./buildAttendanceModal');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
const PORT = process.env.PORT || 3000;


// Load crews
//const crews = JSON.parse(fs.readFileSync('./crews.json', 'utf8'));
const rawData = fs.readFileSync('./crews.json', 'utf8');
//console.log('👉 Raw crews.json content:', rawData); // What does this show?

const crews = JSON.parse(rawData);

// Slash command for /attendance
app.post('/attendance', async (req, res) => {
  const crewName = req.body.text.trim(); // e.g., "Echo"
  const triggerId = req.body.trigger_id;

  // Acknowledge the slash command immediately to prevent timeout
  res.send();

  if (!crews[crewName]) {
    return res.send(`❌ Crew "${crewName}" not found in crews.json.`);
  }

  const students = crews[crewName].students;

  const modalView = buildAttendanceModal(crewName, students);

  try {
    await slackClient.views.open({
      trigger_id: triggerId,
      view: modalView
    });
  } catch (error) {
    console.error('❌ Failed to open modal:', error);
}
});

app.post('/interact', async (req, res) => {
    console.log('📨 Interaction payload received!');
    const payload = JSON.parse(req.body.payload);
  
    if (payload.type === 'view_submission' && payload.view.callback_id === 'attendance_submit') {
      const stateValues = payload.view.state.values;
      const crewName = payload.view.private_metadata;
  
      const crews = JSON.parse(fs.readFileSync('./crews.json', 'utf8'));
      const students = crews[crewName]?.students || [];
  
      const present = [];
      const absent = [];
  
      students.forEach((student, index) => {
        const studentBlock = stateValues[`student_${index}`];
        const reasonBlock = stateValues[`reason_${index}`];
  
        const isPresent = studentBlock?.present_checkbox?.selected_options?.some(
          opt => opt.value === 'present'
        );
  
        if (isPresent) {
          present.push(student);
        } else {
          const reason = reasonBlock?.absence_reason?.value || 'No reason provided';
          absent.push({ name: student, reason });
        }
      });
  
      //console.log(`📋 Attendance for ${crewName}`);
      //console.log('✅ Present:', present);
      //console.log('❌ Absent:', absent);
  
      // Optionally: Send a summary message back to a channel or store in a file/db
      
        const channelId = process.env.ATTENDANCE_CHANNEL;

        // Format current date
        const { DateTime } = require('luxon');

        // Get time in America/Los_Angeles timezone
        const now = DateTime.now().setZone('America/Los_Angeles');

        const timeString = now.toFormat('HH:mm');
        const dateString = now.toFormat('dd LLL yy');

        // Final line
        let summaryText = `📋 *Attendance Report for ${crewName} crew — ${timeString} • ${dateString}*\n`;

        if (present.length > 0) {
            summaryText += `✅ *Present:*\n${present.map(p => `• ${p}`).join('\n')}\n\n`;
        }

        if (absent.length > 0) {
            summaryText += `❌ *Absent:*\n${absent.map(a => `• ${a.name} — ${a.reason}`).join('\n')}`;
        } else {
            summaryText += `🎉 No absentees today!`;
        }

        await slackClient.chat.postMessage({
            channel: channelId,
            text: summaryText
        });

        res.send({ response_action: 'clear' }); // Closes the modal

    } else {
      res.sendStatus(200);
    }
});
  
app.listen(PORT, () => {
  console.log(`✅ Attendance app listening on port ${PORT}`);
});
