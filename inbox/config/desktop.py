# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from frappe import _

def get_data():
	return {
		"Email Inbox": {
			"color": "grey",
			"icon": "octicon octicon-mail",
			"type": "page",
			"link": "email_inbox",
			"label": _("Email Inbox")
		}
	}
