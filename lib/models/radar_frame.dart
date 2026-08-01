// Climeo — developed by Halool.

class RadarFrame {
  final int time;
  final String path;

  const RadarFrame({required this.time, required this.path});

  factory RadarFrame.fromJson(Map<String, dynamic> json) {
    return RadarFrame(
      time: json['time'] as int,
      path: json['path'] as String,
    );
  }
}

class RadarFrameSet {
  final String host;
  final List<RadarFrame> past;
  final List<RadarFrame> nowcast;

  const RadarFrameSet({
    required this.host,
    required this.past,
    required this.nowcast,
  });

  factory RadarFrameSet.fromJson(Map<String, dynamic> json) {
    return RadarFrameSet(
      host: json['host'] as String,
      past: (json['past'] as List)
          .map((e) => RadarFrame.fromJson(e as Map<String, dynamic>))
          .toList(),
      nowcast: (json['nowcast'] as List)
          .map((e) => RadarFrame.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  /// The most recent observed frame — what "now" should show on the map.
  RadarFrame? get latest => past.isNotEmpty ? past.last : null;

  /// All frames in chronological order, past + forecast, for scrubbing
  /// through a radar animation.
  List<RadarFrame> get timeline => [...past, ...nowcast];
}
