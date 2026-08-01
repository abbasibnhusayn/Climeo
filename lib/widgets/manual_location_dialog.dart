// Climeo — developed by Halool.

import 'package:flutter/material.dart';

class ManualLocationDialog extends StatefulWidget {
  const ManualLocationDialog({super.key});

  @override
  State<ManualLocationDialog> createState() => _ManualLocationDialogState();
}

class _ManualLocationDialogState extends State<ManualLocationDialog> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _latController = TextEditingController();
  final _lonController = TextEditingController();

  @override
  void dispose() {
    _labelController.dispose();
    _latController.dispose();
    _lonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Enter a location'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _labelController,
              decoration: const InputDecoration(labelText: 'Label (e.g. Home)'),
              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
            ),
            TextFormField(
              controller: _latController,
              decoration: const InputDecoration(labelText: 'Latitude'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
              validator: (v) {
                final value = double.tryParse(v ?? '');
                if (value == null || value < -90 || value > 90) return 'Enter a value between -90 and 90';
                return null;
              },
            ),
            TextFormField(
              controller: _lonController,
              decoration: const InputDecoration(labelText: 'Longitude'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
              validator: (v) {
                final value = double.tryParse(v ?? '');
                if (value == null || value < -180 || value > 180) return 'Enter a value between -180 and 180';
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            if (!_formKey.currentState!.validate()) return;
            Navigator.of(context).pop((
              latitude: double.parse(_latController.text),
              longitude: double.parse(_lonController.text),
              label: _labelController.text,
            ));
          },
          child: const Text('Use this location'),
        ),
      ],
    );
  }
}
