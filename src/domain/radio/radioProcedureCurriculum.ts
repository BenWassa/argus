import type { Curriculum } from '../learning/stages'

/** Draft, source-bounded lesson content; see codex-REPORT.md for review gaps. */
export const radioProcedureCurriculum: Curriculum = {
  "stages": [
    {
      "id": "words-that-agree",
      "title": "Words That Agree",
      "steps": [
        {
          "kind": "show",
          "id": "words-that-agree-show-roger",
          "title": "ROGER",
          "body": "I have received all of your last transmission.",
          "itemId": "radio-procedure-item-09"
        },
        {
          "kind": "show",
          "id": "words-that-agree-show-wilco",
          "title": "WILCO",
          "body": "Your instructions received, understood and will be complied with.",
          "itemId": "radio-procedure-item-12"
        },
        {
          "kind": "show",
          "id": "words-that-agree-show-acknowledge",
          "title": "ACKNOWLEDGE",
          "body": "Let me know that you have received and understood this message.",
          "itemId": "radio-procedure-item-01"
        },
        {
          "kind": "show",
          "id": "words-that-agree-show-affirmative",
          "title": "AFFIRMATIVE",
          "body": "Yes, or permission granted.",
          "itemId": "radio-procedure-item-02"
        },
        {
          "kind": "show",
          "id": "words-that-agree-show-negative",
          "title": "NEGATIVE",
          "body": "No, or that is not correct, or I do not agree.",
          "itemId": "radio-procedure-item-05"
        },
        {
          "kind": "choose",
          "id": "words-that-agree-choose-roger",
          "itemId": "radio-procedure-item-09",
          "prompt": "ROGER",
          "options": [
            "I have received all of your last transmission.",
            "Your instructions received, understood and will be complied with.",
            "Let me know that you have received and understood this message.",
            "Yes, or permission granted."
          ],
          "answer": "I have received all of your last transmission.",
          "explain": "ROGER states receipt of the last transmission."
        },
        {
          "kind": "choose",
          "id": "words-that-agree-choose-wilco",
          "itemId": "radio-procedure-item-12",
          "prompt": "WILCO",
          "options": [
            "Your instructions received, understood and will be complied with.",
            "I have received all of your last transmission.",
            "Let me know that you have received and understood this message.",
            "Yes, or permission granted."
          ],
          "answer": "Your instructions received, understood and will be complied with.",
          "explain": "WILCO includes receipt, understanding and compliance."
        },
        {
          "kind": "choose",
          "id": "words-that-agree-choose-acknowledge",
          "itemId": "radio-procedure-item-01",
          "prompt": "ACKNOWLEDGE",
          "options": [
            "Let me know that you have received and understood this message.",
            "I have received all of your last transmission.",
            "Your instructions received, understood and will be complied with.",
            "Yes, or permission granted."
          ],
          "answer": "Let me know that you have received and understood this message.",
          "explain": "ACKNOWLEDGE requests receipt and understanding."
        },
        {
          "kind": "choose",
          "id": "words-that-agree-choose-affirmative",
          "itemId": "radio-procedure-item-02",
          "prompt": "AFFIRMATIVE",
          "options": [
            "Yes, or permission granted.",
            "I have received all of your last transmission.",
            "Your instructions received, understood and will be complied with.",
            "Let me know that you have received and understood this message."
          ],
          "answer": "Yes, or permission granted.",
          "explain": "AFFIRMATIVE means yes or permission granted."
        },
        {
          "kind": "choose",
          "id": "words-that-agree-choose-negative",
          "itemId": "radio-procedure-item-05",
          "prompt": "NEGATIVE",
          "options": [
            "No, or that is not correct, or I do not agree.",
            "I have received all of your last transmission.",
            "Your instructions received, understood and will be complied with.",
            "Let me know that you have received and understood this message."
          ],
          "answer": "No, or that is not correct, or I do not agree.",
          "explain": "NEGATIVE means no, incorrect or disagreement."
        },
        {
          "kind": "contrast",
          "id": "words-that-agree-contrast",
          "itemIds": [
            "radio-procedure-item-09",
            "radio-procedure-item-12",
            "radio-procedure-item-01"
          ],
          "answerItemId": "radio-procedure-item-12",
          "prompt": "Your instructions received, understood and will be complied with.",
          "explain": "WILCO includes compliance; ROGER states receipt and ACKNOWLEDGE requests receipt and understanding."
        },
        {
          "kind": "summary",
          "id": "words-that-agree-summary",
          "text": "ROGER / WILCO / ACKNOWLEDGE / AFFIRMATIVE / NEGATIVE"
        }
      ]
    },
    {
      "id": "ending-and-turns",
      "title": "Ending and Turns",
      "steps": [
        {
          "kind": "show",
          "id": "ending-and-turns-show-over",
          "title": "OVER",
          "body": "My transmission is ended and I expect a response from you.",
          "itemId": "radio-procedure-item-07"
        },
        {
          "kind": "show",
          "id": "ending-and-turns-show-out",
          "title": "OUT",
          "body": "Conversation is ended and no response is expected.",
          "itemId": "radio-procedure-item-06"
        },
        {
          "kind": "show",
          "id": "ending-and-turns-show-go-ahead",
          "title": "GO AHEAD",
          "body": "Proceed with your message.",
          "itemId": "radio-procedure-item-04"
        },
        {
          "kind": "show",
          "id": "ending-and-turns-show-stand-by",
          "title": "STAND BY",
          "body": "I must pause for a few seconds or minutes, please wait and I will call you.",
          "itemId": "radio-procedure-item-11"
        },
        {
          "kind": "choose",
          "id": "ending-and-turns-choose-over",
          "itemId": "radio-procedure-item-07",
          "prompt": "OVER",
          "options": [
            "My transmission is ended and I expect a response from you.",
            "Conversation is ended and no response is expected.",
            "Proceed with your message.",
            "I must pause for a few seconds or minutes, please wait and I will call you."
          ],
          "answer": "My transmission is ended and I expect a response from you.",
          "explain": "OVER expects a response."
        },
        {
          "kind": "choose",
          "id": "ending-and-turns-choose-out",
          "itemId": "radio-procedure-item-06",
          "prompt": "OUT",
          "options": [
            "Conversation is ended and no response is expected.",
            "My transmission is ended and I expect a response from you.",
            "Proceed with your message.",
            "I must pause for a few seconds or minutes, please wait and I will call you."
          ],
          "answer": "Conversation is ended and no response is expected.",
          "explain": "OUT ends the conversation with no response expected."
        },
        {
          "kind": "choose",
          "id": "ending-and-turns-choose-go-ahead",
          "itemId": "radio-procedure-item-04",
          "prompt": "GO AHEAD",
          "options": [
            "Proceed with your message.",
            "My transmission is ended and I expect a response from you.",
            "Conversation is ended and no response is expected.",
            "I must pause for a few seconds or minutes, please wait and I will call you."
          ],
          "answer": "Proceed with your message.",
          "explain": "GO AHEAD invites the message."
        },
        {
          "kind": "choose",
          "id": "ending-and-turns-choose-stand-by",
          "itemId": "radio-procedure-item-11",
          "prompt": "STAND BY",
          "options": [
            "I must pause for a few seconds or minutes, please wait and I will call you.",
            "My transmission is ended and I expect a response from you.",
            "Conversation is ended and no response is expected.",
            "Proceed with your message."
          ],
          "answer": "I must pause for a few seconds or minutes, please wait and I will call you.",
          "explain": "STAND BY requests waiting until the caller calls again."
        },
        {
          "kind": "contrast",
          "id": "ending-and-turns-contrast",
          "itemIds": [
            "radio-procedure-item-07",
            "radio-procedure-item-06"
          ],
          "answerItemId": "radio-procedure-item-07",
          "prompt": "My transmission is ended and I expect a response from you.",
          "explain": "OVER expects a response; OUT expects no response."
        },
        {
          "kind": "summary",
          "id": "ending-and-turns-summary",
          "text": "OVER / OUT / GO AHEAD / STAND BY"
        }
      ]
    },
    {
      "id": "fixing-mistakes",
      "title": "Fixing Mistakes",
      "steps": [
        {
          "kind": "show",
          "id": "fixing-mistakes-show-say-again",
          "title": "SAY AGAIN",
          "body": "Send your transmission again, in whole or the part named. Never say “REPEAT”.",
          "itemId": "radio-procedure-item-10"
        },
        {
          "kind": "show",
          "id": "fixing-mistakes-show-read-back",
          "title": "READ BACK",
          "body": "Repeat all, or the specified part of this message back to me exactly as received.",
          "itemId": "radio-procedure-item-08"
        },
        {
          "kind": "show",
          "id": "fixing-mistakes-show-correction",
          "title": "CORRECTION",
          "body": "An error has been made in this transmission (message indicated). The correct version is…",
          "itemId": "radio-procedure-item-03"
        },
        {
          "kind": "show",
          "id": "fixing-mistakes-repeat",
          "title": "SAY AGAIN / READ BACK",
          "body": "Use SAY AGAIN or READ BACK, never “REPEAT”."
        },
        {
          "kind": "choose",
          "id": "fixing-mistakes-choose-say-again",
          "itemId": "radio-procedure-item-10",
          "prompt": "SAY AGAIN",
          "options": [
            "Send your transmission again, in whole or the part named. Never say “REPEAT”.",
            "Repeat all, or the specified part of this message back to me exactly as received.",
            "An error has been made in this transmission (message indicated). The correct version is…",
            "Let me know that you have received and understood this message."
          ],
          "answer": "Send your transmission again, in whole or the part named. Never say “REPEAT”.",
          "explain": "SAY AGAIN requests the transmission again in whole or the named part."
        },
        {
          "kind": "choose",
          "id": "fixing-mistakes-choose-read-back",
          "itemId": "radio-procedure-item-08",
          "prompt": "READ BACK",
          "options": [
            "Repeat all, or the specified part of this message back to me exactly as received.",
            "Send your transmission again, in whole or the part named. Never say “REPEAT”.",
            "An error has been made in this transmission (message indicated). The correct version is…",
            "Let me know that you have received and understood this message."
          ],
          "answer": "Repeat all, or the specified part of this message back to me exactly as received.",
          "explain": "READ BACK requests the message back exactly as received."
        },
        {
          "kind": "choose",
          "id": "fixing-mistakes-choose-correction",
          "itemId": "radio-procedure-item-03",
          "prompt": "CORRECTION",
          "options": [
            "An error has been made in this transmission (message indicated). The correct version is…",
            "Send your transmission again, in whole or the part named. Never say “REPEAT”.",
            "Repeat all, or the specified part of this message back to me exactly as received.",
            "Let me know that you have received and understood this message."
          ],
          "answer": "An error has been made in this transmission (message indicated). The correct version is…",
          "explain": "CORRECTION introduces the correct version of a transmission error."
        },
        {
          "kind": "contrast",
          "id": "fixing-mistakes-contrast",
          "itemIds": [
            "radio-procedure-item-10",
            "radio-procedure-item-08"
          ],
          "answerItemId": "radio-procedure-item-08",
          "prompt": "Repeat all, or the specified part of this message back to me exactly as received.",
          "explain": "SAY AGAIN requests retransmission; READ BACK requests the message back exactly as received."
        },
        {
          "kind": "summary",
          "id": "fixing-mistakes-summary",
          "text": "SAY AGAIN / READ BACK / CORRECTION"
        }
      ]
    },
    {
      "id": "call-order",
      "title": "Call Order",
      "steps": [
        {
          "kind": "show",
          "id": "call-order-show-one-station",
          "title": "One station",
          "body": "Called station → THIS IS → Calling station → Invitation to reply",
          "itemId": "radio-procedure-item-13"
        },
        {
          "kind": "show",
          "id": "call-order-show-all-stations",
          "title": "All stations",
          "body": "ALL STATIONS → THIS IS → Calling station → Invitation to reply",
          "itemId": "radio-procedure-item-14"
        },
        {
          "kind": "show",
          "id": "call-order-show-message-handling",
          "title": "Message handling",
          "body": "Call → Addressee reply → Message → Acknowledgement or ending",
          "itemId": "radio-procedure-item-15"
        },
        {
          "kind": "order",
          "id": "call-order-order-one-station",
          "itemId": "radio-procedure-item-13",
          "prompt": "In a call to one specific station, in what order does RIC-22 give the call?",
          "blocks": [
            "Called station",
            "THIS IS",
            "Calling station",
            "Invitation to reply"
          ],
          "explain": "Called station comes before THIS IS."
        },
        {
          "kind": "choose",
          "id": "call-order-choose-one-station",
          "itemId": "radio-procedure-item-13",
          "prompt": "In a call to one specific station, in what order does RIC-22 give the call?",
          "options": [
            "Called station → Calling station → THIS IS → Invitation to reply",
            "Called station → THIS IS → Calling station → Invitation to reply",
            "Called station → THIS IS → Invitation to reply → Calling station",
            "Calling station → THIS IS → Called station → Invitation to reply"
          ],
          "answer": "Called station → THIS IS → Calling station → Invitation to reply",
          "explain": "Called station comes before THIS IS."
        },
        {
          "kind": "order",
          "id": "call-order-order-all-stations",
          "itemId": "radio-procedure-item-14",
          "prompt": "In an ALL STATIONS call, in what order does RIC-22 give the call?",
          "blocks": [
            "ALL STATIONS",
            "THIS IS",
            "Calling station",
            "Invitation to reply"
          ],
          "explain": "ALL STATIONS comes before THIS IS."
        },
        {
          "kind": "choose",
          "id": "call-order-choose-all-stations",
          "itemId": "radio-procedure-item-14",
          "prompt": "In an ALL STATIONS call, in what order does RIC-22 give the call?",
          "options": [
            "ALL STATIONS → Calling station → THIS IS → Invitation to reply",
            "ALL STATIONS → THIS IS → Calling station → Invitation to reply",
            "ALL STATIONS → THIS IS → Invitation to reply → Calling station",
            "Calling station → THIS IS → ALL STATIONS → Invitation to reply"
          ],
          "answer": "ALL STATIONS → THIS IS → Calling station → Invitation to reply",
          "explain": "ALL STATIONS comes before THIS IS."
        },
        {
          "kind": "order",
          "id": "call-order-order-message-handling",
          "itemId": "radio-procedure-item-15",
          "prompt": "What are the four parts of the RIC-22 message-handling format, in order?",
          "blocks": [
            "Call",
            "Addressee reply",
            "Message",
            "Acknowledgement or ending"
          ],
          "explain": "Call comes before Addressee reply."
        },
        {
          "kind": "choose",
          "id": "call-order-choose-message-handling",
          "itemId": "radio-procedure-item-15",
          "prompt": "What are the four parts of the RIC-22 message-handling format, in order?",
          "options": [
            "Addressee reply → Call → Message → Acknowledgement or ending",
            "Call → Addressee reply → Acknowledgement or ending → Message",
            "Call → Addressee reply → Message → Acknowledgement or ending",
            "Call → Message → Addressee reply → Acknowledgement or ending"
          ],
          "answer": "Call → Addressee reply → Message → Acknowledgement or ending",
          "explain": "Call comes before Addressee reply."
        },
        {
          "kind": "summary",
          "id": "call-order-summary",
          "text": "One station / All stations / Message handling"
        }
      ]
    },
    {
      "id": "putting-it-together",
      "title": "Putting It Together",
      "steps": [
        {
          "kind": "show",
          "id": "together-show",
          "title": "Radio Procedure",
          "body": "Recall only. Not radio training, an operator certificate or permission to transmit."
        },
        {
          "kind": "checkpoint",
          "id": "together-checkpoint",
          "itemIds": [
            "radio-procedure-item-01",
            "radio-procedure-item-02",
            "radio-procedure-item-03",
            "radio-procedure-item-04",
            "radio-procedure-item-05",
            "radio-procedure-item-06",
            "radio-procedure-item-07",
            "radio-procedure-item-08",
            "radio-procedure-item-09",
            "radio-procedure-item-10",
            "radio-procedure-item-11",
            "radio-procedure-item-12",
            "radio-procedure-item-13",
            "radio-procedure-item-14",
            "radio-procedure-item-15"
          ]
        },
        {
          "kind": "contrast",
          "id": "together-contrast-1",
          "itemIds": [
            "radio-procedure-item-07",
            "radio-procedure-item-06"
          ],
          "answerItemId": "radio-procedure-item-07",
          "prompt": "My transmission is ended and I expect a response from you.",
          "explain": "OVER expects a response; OUT expects no response."
        },
        {
          "kind": "contrast",
          "id": "together-contrast-2",
          "itemIds": [
            "radio-procedure-item-10",
            "radio-procedure-item-08"
          ],
          "answerItemId": "radio-procedure-item-08",
          "prompt": "Repeat all, or the specified part of this message back to me exactly as received.",
          "explain": "SAY AGAIN requests retransmission; READ BACK requests the message back exactly as received."
        },
        {
          "kind": "summary",
          "id": "together-summary",
          "text": "ROGER / WILCO / ACKNOWLEDGE / OVER / OUT / SAY AGAIN / READ BACK / One station / All stations / Message handling"
        }
      ]
    }
  ]
}
