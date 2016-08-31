# -*- coding: utf-8 -*-
from setuptools import setup, find_packages
import os

version = '0.0.1'

setup(
    name='inbox',
    version=version,
    description='Email Inbox for all users',
    author='Robert Schouten',
    author_email='robert.schouten@ia-group.com.au',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=("frappe","erpnext",),
)
