function buildAttendanceModal(crewName, students) {
    const blocks = [];
  
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Taking attendance for *${crewName}*`
      }
    });
  
    blocks.push({ type: "divider" });
  
    students.forEach((student, index) => {
      blocks.push({
        type: "input",
        block_id: `student_${index}`,
        label: {
          type: "plain_text",
          text: student
        },
        element: {
          type: "checkboxes",
          action_id: "present_checkbox",
          options: [
            {
              text: {
                type: "plain_text",
                text: "Present"
              },
              value: "present"
            }
          ]
        },
        optional: true
      });
  
      blocks.push({
        type: "input",
        block_id: `reason_${index}`,
        label: {
          type: "plain_text",
          text: `Absence Reason (if ${student} is absent)`
        },
        element: {
          type: "plain_text_input",
          action_id: "absence_reason"
        },
        optional: true
      });
    });
  
    return {
      type: "modal",
      callback_id: "attendance_submit",
      private_metadata: crewName, // Store the crew name here
      title: {
        type: "plain_text",
        text: "Attendance"
      },
      submit: {
        type: "plain_text",
        text: "Submit"
      },
      close: {
        type: "plain_text",
        text: "Cancel"
      },
      blocks
    };
  }
  
  module.exports = buildAttendanceModal;
  