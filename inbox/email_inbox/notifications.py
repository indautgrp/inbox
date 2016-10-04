from __future__ import unicode_literals
import frappe

def get_notification_config():
	return {
		"for_other": {
			"Email Inbox": "inbox.email_inbox.notifications.get_unread_emails"
		}
	}
@frappe.whitelist()
def get_unread_emails():
	return 5