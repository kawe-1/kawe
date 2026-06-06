# Kawe API

Backend API for the Kawe platform.

## Overview

Kawe is an AI-powered learning platform that helps students transform scattered learning materials into a single, interactive study experience.

Students can upload PDFs, lecture recordings, YouTube videos, and images of handwritten notes into a Topic Session. The platform combines all uploaded content into a unified knowledge base and provides AI-powered study tools built on top of that knowledge.

The goal is to help students learn from all their materials as a whole rather than as separate, disconnected resources.

---

# Core Concepts

## Topic Session

A Topic Session is a workspace dedicated to a single subject or topic.

Examples:

* Data Structures - Week 5
* Organic Chemistry Revision
* Machine Learning Fundamentals

All uploaded materials, generated content, and interactions belong to a Topic Session.

---

# Features

## Multi-Source Content Ingestion

Allows students to upload learning materials from multiple sources into a single Topic Session.

Supported sources:

* PDF Documents
* Audio Recordings
* YouTube Videos
* Images of Notes

### Objective

Create a single learning workspace regardless of where the content originated.

---

## Unified Knowledge Base

All uploaded materials are merged into a shared knowledge base.

The platform treats uploaded content as one learning resource rather than multiple isolated files.

### Objective

Enable cross-source understanding and eliminate fragmented learning experiences.

---

## AI Study Notes

Generates comprehensive notes from all content within a Topic Session.

### Objective

Provide students with a consolidated overview of their learning materials.

---

## Concept Simplification

Breaks down difficult concepts into simpler explanations.

### Objective

Improve understanding of complex topics and technical concepts.

---

## Quiz Generation

Creates practice and revision questions based on the Topic Session knowledge base.

### Objective

Help students assess understanding and prepare for examinations.

---

## Flashcards

Generates flashcards covering key concepts, definitions, and important facts.

### Objective

Support active recall and revision.

---

## AI Tutor Chat

Allows students to ask questions about their uploaded learning materials.

The tutor has access to the entire Topic Session knowledge base.

### Objective

Provide contextual guidance and support during learning.

---

## Voice Tutor

Allows students to interact with the AI tutor using natural speech.

Students can ask questions verbally and receive spoken responses.

### Objective

Create a more natural and engaging tutoring experience.

---

# Project Objectives

The backend should enable:

* Creation and management of Topic Sessions
* Ingestion of multiple content types
* Construction of a unified knowledge base
* Generation of AI-powered learning resources
* Conversational tutoring through text and voice
* Cross-source understanding across all uploaded materials