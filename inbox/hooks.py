# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "inbox"
app_title = "Email Inbox"
app_publisher = "Robert Schouten"
app_description = "Email Inbox for all users"
app_icon = "octicon octicon-mail"
app_color = "grey"
app_email = "robert.schouten@ia-group.com.au"
app_version = "0.0.1"
app_license = "MIT"
#fixtures = ["Custom Field","Custom Script"]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/inbox/css/inbox.css"
app_include_js = [
"assets/js/desk2.min.js",
]

# include js, css files in header of web template
# web_include_css = "/assets/inbox/css/inbox.css"
# web_include_js = "/assets/inbox/js/inbox.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "inbox.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "inbox.install.before_install"
after_install = "inbox.install.link_communications_contacts.execute"


# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

notification_config = "inbox.email_inbox.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Contact":{
		"validate":"inbox.email_inbox.contact.contact_update_communication_ref"
	},
	"Communication":{
		"after_insert":"inbox.email_inbox.contact.match_email_to_contact"
	},
	"User":{
		"validate":"inbox.email_inbox.user.user_validate"
	},
	"Email Account":{
		"on_update":"inbox.email_inbox.user.push_email_to_user_emails"
	}
	
}
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }
#doc_events = {
#	"*": {
#		"validate": "inbox.email_inbox.tester"
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
#}

# Scheduled Tasks
# ---------------

 #scheduler_events = {
# 	"all": [
# 		"inbox.tasks.all"
# 	],
# 	"daily": [
# 		"inbox.tasks.daily"
# 	],
#	"hourly": [
#		"inbox.tasks.hourly"
# 	],
# 	"weekly": [
# 		"inbox.tasks.weekly"
# 	]
# 	"monthly": [
# 		"inbox.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "inbox.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "inbox.event.get_events"
# }

mid_email_sync = "inbox.email_inbox.testsync"